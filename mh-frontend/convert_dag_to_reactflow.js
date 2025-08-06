const { Pool } = require("pg");
const dagre = require("dagre");

// Load environment variables
require("dotenv").config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  port: process.env.DB_PORT || 5432,
});

// React Flow conversion function (ported from TypeScript)
function convertDagToReactFlow(dag, courseMetadata) {
  // 1) Build a dagre graph for auto-layout
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "TB", // Top to bottom layout
    marginx: 50,
    marginy: 50,
    nodesep: 100, // Vertical separation between nodes
    edgesep: 50, // Horizontal separation between edges
    ranksep: 150, // Separation between ranks
  });
  g.setDefaultEdgeLabel(() => ({}));

  // 2) Add nodes to dagre with different sizes based on type
  dag.nodes.forEach((n) => {
    const isCourse = n.course_id && courseMetadata[n.course_id];
    const isLogicNode = n.type === "AND" || n.type === "OR";

    if (isCourse) {
      // Course nodes are larger to accommodate course info
      g.setNode(n.id, { width: 250, height: 120 });
    } else if (isLogicNode) {
      // Logic nodes (AND/OR) are smaller
      g.setNode(n.id, { width: 80, height: 40 });
    } else {
      // Default size for other nodes
      g.setNode(n.id, { width: 150, height: 60 });
    }
  });

  // 3) Add edges to dagre
  dag.links.forEach((l) => {
    const source = l.source || l.from;
    const target = l.target || l.to;
    if (source && target) {
      g.setEdge(source, target);
    }
  });

  // 4) Run layout
  dagre.layout(g);

  // 5) Map to React Flow nodes
  const nodes = dag.nodes.map((n) => {
    const nodeData = g.node(n.id);
    const isCourse = n.course_id && courseMetadata[n.course_id];
    const isLogicNode = n.type === "AND" || n.type === "OR";

    let nodeType = "default";
    let data = { label: n.label || n.id };

    if (isCourse) {
      nodeType = "courseCard";
      const course = courseMetadata[n.course_id];
      data = {
        ...course,
        courseId: n.course_id,
        label: course.title,
        isMainCourse: false,
      };
    } else if (isLogicNode) {
      nodeType = "logicNode";
      data = {
        label: n.type,
        type: n.type,
        isLogicNode: true,
      };
    }

    return {
      id: n.id,
      type: nodeType,
      data: data,
      position: {
        x: nodeData.x - nodeData.width / 2,
        y: nodeData.y - nodeData.height / 2,
      },
    };
  });

  // 6) Map to React Flow edges
  const edges = dag.links
    .map((l, i) => {
      const source = l.source || l.from;
      const target = l.target || l.to;
      if (!source || !target) return null;

      return {
        id: `e-${source}-${target}-${i}`,
        source: source,
        target: target,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#64748b", strokeWidth: 2 },
        markerEnd: {
          type: "arrowclosed",
          width: 20,
          height: 20,
          color: "#64748b",
        },
      };
    })
    .filter((edge) => edge !== null);

  return { nodes, edges };
}

async function convertAllPrereqDags() {
  try {
    console.log("🔄 Starting conversion of all prerequisite DAGs...");

    // 1. Get all courses from the database
    const coursesResult = await pool.query(
      "SELECT course_id, course_code, title, description, credits, level, college, last_taught_term FROM courses"
    );
    const courseMetadata = {};

    coursesResult.rows.forEach((row) => {
      courseMetadata[row.course_id] = {
        course_id: row.course_id,
        course_code: row.course_code,
        title: row.title,
        description: row.description,
        credits: row.credits ? parseFloat(row.credits) : null,
        level: row.level,
        college: row.college,
        last_taught_term: row.last_taught_term,
      };
    });

    console.log(
      `📚 Found ${Object.keys(courseMetadata).length} courses in database`
    );

    // 2. Get all prerequisite DAGs
    const prereqResult = await pool.query(
      "SELECT course_id, prereq_dag_json FROM prereq_dags"
    );
    console.log(
      `🔄 Found ${prereqResult.rows.length} prerequisite DAGs to convert`
    );

    // 3. Convert each DAG
    let successCount = 0;
    let errorCount = 0;

    for (const row of prereqResult.rows) {
      try {
        const courseId = row.course_id;
        const dagData = row.prereq_dag_json;

        if (!dagData || !dagData.nodes) {
          console.log(`⚠️  Skipping course ${courseId}: No DAG data or nodes`);
          continue;
        }

        // Convert D3 format to React Flow format
        const reactFlowData = convertDagToReactFlow(dagData, courseMetadata);

        // Update the database with the converted React Flow data
        await pool.query(
          "UPDATE prereq_dags SET reactflow_dag_json = $1 WHERE course_id = $2",
          [JSON.stringify(reactFlowData), courseId]
        );

        console.log(
          `✅ Converted course ${courseId}: ${reactFlowData.nodes.length} nodes, ${reactFlowData.edges.length} edges`
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ Error converting course ${row.course_id}:`,
          error.message
        );
        errorCount++;
      }
    }

    console.log(`\n🎉 Conversion complete!`);
    console.log(`✅ Successfully converted: ${successCount} DAGs`);
    console.log(`❌ Errors: ${errorCount} DAGs`);
  } catch (error) {
    console.error("💥 Fatal error:", error);
  } finally {
    await pool.end();
  }
}

// Run the conversion
convertAllPrereqDags();
