# app/core/prereq_graph.py

from typing import Any, Dict, List, Union
from app.core.config import get_db_connection

PrereqExpr = Union[str, Dict[str, Any]]

def fetch_aog_json(course_id: int) -> PrereqExpr:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT prereq_dag_json FROM prereq_dags WHERE course_id=%s", (course_id,))
    row = cur.fetchone()
    return row[0] if row else "None"

def normalize_node(node: PrereqExpr) -> str:
    if isinstance(node, str):
        return node
    subj = "/".join(node["subjects"])
    num  = str(node["course_number"])
    return f"{subj} {num}"

counter = 0
def next_op_node(op: str) -> str:
    """Emit a unique node id for each operator occurrence."""
    global counter
    counter += 1
    return f"{op}_{counter}"

def walk(expr: PrereqExpr,
         parent: str,
         nodes: List[Dict[str,str]],
         links: List[Dict[str,str]]):
    """
    Recursively walk the AOG. Whenever you see an operator,
    create an intermediate operator-node.
    """
    if isinstance(expr, dict) and "operator" in expr and "children" in expr:
        op = expr["operator"]  # "AND" or "OR"
        op_node = next_op_node(op)
        nodes.append({"id": op_node, "type": op})
        # link op_node → parent (the course or another op)
        links.append({"source": op_node, "target": parent})
        # recurse into each branch, linking leafs → op_node
        for child in expr["children"]:
            walk(child, op_node, nodes, links)
    else:
        # leaf node
        leaf = normalize_node(expr)
        if not any(n["id"] == leaf for n in nodes):
            nodes.append({"id": leaf, "type": "LEAF"})
        links.append({"source": leaf, "target": parent})

def get_prereq_graph(course_id: int,
                     subj: str,
                     num: int) -> Dict[str, List[Dict[str,str]]]:
    """
    Load raw AOG, build nodes/links with explicit AND/OR nodes,
    then connect the top operator(s) to the course root.
    """
    global counter
    counter = 0
    raw = fetch_aog_json(course_id)
    nodes: List[Dict[str,str]] = []
    links: List[Dict[str,str]] = []
    root = f"{subj} {num}"
    nodes.append({"id": root, "type": "COURSE"})
    walk(raw, root, nodes, links)
    return {"nodes": nodes, "links": links}
