from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional, Dict, Any, Union
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
import os
import logging
from dotenv import load_dotenv
import redis.asyncio as redis
from app.services.user_progress_service import UserProgressService
from app.services.cache_service import CacheService, PrerequisiteCacheKeys, CacheTTL

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter(prefix="/prerequisites", tags=["prerequisites"])

# Redis dependency
async def get_redis_client():
    """Get Redis client for caching"""
    try:
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            db=int(os.getenv("REDIS_DB", "0")),
            decode_responses=True
        )
        await redis_client.ping()  # Test connection
        return redis_client
    except Exception as e:
        logger.warning(f"Redis connection failed: {str(e)}. Caching will be disabled.")
        return None

# Database connection helper
def get_db_connection():
    """Create a database connection"""
    try:
        connection = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "postgres"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            port=os.getenv("DB_PORT", "5432")
        )
        return connection
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@router.get("/course/{course_id}")
async def get_course_prerequisites(course_id: int):
    """
    Get complete prerequisite data for a course using the optimized query strategy.
    
    This endpoint implements Phase 1 of the database query strategy:
    - Fetches the main course's DAG from prereq_dags table
    - Extracts all course IDs from the JSONB nodes
    - Enriches all courses with metadata in a single query
    - Returns everything in one response to avoid N+1 problems
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Execute the optimized prerequisite query
        query = """
        SELECT * FROM get_course_prerequisites(%s)
        ORDER BY is_main_course DESC, course_code
        """
        
        cursor.execute(query, (course_id,))
        results = cursor.fetchall()
        
        if not results:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Process results
        main_course = None
        prerequisite_courses = []
        prereq_dag = None
        
        for row in results:
            course_data = dict(row)
            
            if course_data['is_main_course']:
                main_course = {
                    'course_id': course_data['course_id'],
                    'course_code': course_data['course_code'],
                    'title': course_data['title'],
                    'credits': float(course_data['credits']) if course_data['credits'] else None,
                    'level': course_data['level'],
                    'college': course_data['college'],
                    'last_taught_term': course_data['last_taught_term']
                }
                prereq_dag = course_data['prereq_dag_json']
            else:
                prerequisite_courses.append({
                    'course_id': course_data['course_id'],
                    'course_code': course_data['course_code'],
                    'title': course_data['title'],
                    'credits': float(course_data['credits']) if course_data['credits'] else None,
                    'level': course_data['level'],
                    'college': course_data['college'],
                    'last_taught_term': course_data['last_taught_term']
                })
        
        cursor.close()
        conn.close()
        
        return {
            'main_course': main_course,
            'prerequisite_courses': prerequisite_courses,
            'prerequisite_dag': prereq_dag,
            'total_prerequisites': len(prerequisite_courses),
            'query_optimization': {
                'strategy': 'Phase 1: Single Query with CTEs',
                'performance_notes': 'Fetches all prerequisite data in one optimized query using JSONB operations'
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching prerequisites: {str(e)}")

@router.get("/course/{course_id}/tree")
async def get_prerequisite_tree(course_id: int):
    """
    Get prerequisite tree with depth information for a course.
    Shows the hierarchical structure of prerequisites.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT * FROM get_prerequisite_tree(%s)
        """
        
        cursor.execute(query, (course_id,))
        results = cursor.fetchall()
        
        if not results:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Group by depth
        tree_by_depth = {}
        for row in results:
            depth = row['depth']
            if depth not in tree_by_depth:
                tree_by_depth[depth] = []
            
            tree_by_depth[depth].append({
                'course_id': row['course_id'],
                'course_code': row['course_code'],
                'title': row['title'],
                'credits': float(row['credits']) if row['credits'] else None,
                'level': row['level'],
                'college': row['college'],
                'path': row['path']
            })
        
        cursor.close()
        conn.close()
        
        return {
            'course_id': course_id,
            'max_depth': max(tree_by_depth.keys()) if tree_by_depth else 0,
            'tree_by_depth': tree_by_depth,
            'total_courses': len(results)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching prerequisite tree: {str(e)}")

@router.post("/course/{course_id}/eligibility")
async def check_course_eligibility(
    course_id: int,
    completed_courses: List[int] = Query(..., description="List of completed course IDs")
):
    """
    Check if a student can take a course based on their completed courses.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Convert list to PostgreSQL array format
        completed_array = "{" + ",".join(map(str, completed_courses)) + "}"
        
        query = """
        SELECT * FROM can_take_course(%s, %s::int[])
        """
        
        cursor.execute(query, (course_id, completed_array))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get details for missing prerequisites
        missing_details = []
        if result['missing_prereqs']:
            placeholders = ','.join(['%s'] * len(result['missing_prereqs']))
            detail_query = f"""
            SELECT course_id, course_code, title, credits, level, college
            FROM courses
            WHERE course_id IN ({placeholders})
            """
            cursor.execute(detail_query, result['missing_prereqs'])
            missing_details = [dict(row) for row in cursor.fetchall()]
        
        # Get details for satisfied prerequisites
        satisfied_details = []
        if result['satisfied_prereqs']:
            placeholders = ','.join(['%s'] * len(result['satisfied_prereqs']))
            detail_query = f"""
            SELECT course_id, course_code, title, credits, level, college
            FROM courses
            WHERE course_id IN ({placeholders})
            """
            cursor.execute(detail_query, result['satisfied_prereqs'])
            satisfied_details = [dict(row) for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return {
            'course_id': course_id,
            'can_take': result['can_take'],
            'missing_prerequisites': {
                'count': len(result['missing_prereqs']) if result['missing_prereqs'] else 0,
                'course_ids': result['missing_prereqs'],
                'courses': missing_details
            },
            'satisfied_prerequisites': {
                'count': len(result['satisfied_prereqs']) if result['satisfied_prereqs'] else 0,
                'course_ids': result['satisfied_prereqs'],
                'courses': satisfied_details
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking eligibility: {str(e)}")

@router.get("/course/{course_id}/eligibility/user")
async def check_user_course_eligibility(
    course_id: int,
    user_id: str = Query(..., description="User ID to check eligibility for")
):
    """
    Check if a specific user is eligible to take a course based on their DARS data and progress.
    """
    try:
        conn = get_db_connection()
        progress_service = UserProgressService(conn)
        
        # Get comprehensive eligibility information
        eligibility = await progress_service.get_course_eligibility(user_id, course_id)
        
        # Get course details for missing prerequisites
        missing_details = []
        if eligibility['missing_prerequisites']:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            placeholders = ','.join(['%s'] * len(eligibility['missing_prerequisites']))
            detail_query = f"""
            SELECT course_id, course_code, title, credits, level, college
            FROM courses
            WHERE course_id IN ({placeholders})
            """
            cursor.execute(detail_query, eligibility['missing_prerequisites'])
            missing_details = [dict(row) for row in cursor.fetchall()]
            cursor.close()
        
        # Get course details for satisfied prerequisites
        satisfied_details = []
        if eligibility['satisfied_prerequisites']:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            placeholders = ','.join(['%s'] * len(eligibility['satisfied_prerequisites']))
            detail_query = f"""
            SELECT course_id, course_code, title, credits, level, college
            FROM courses
            WHERE course_id IN ({placeholders})
            """
            cursor.execute(detail_query, eligibility['satisfied_prerequisites'])
            satisfied_details = [dict(row) for row in cursor.fetchall()]
            cursor.close()
        
        conn.close()
        
        return {
            'course_id': course_id,
            'user_id': user_id,
            'eligible': eligibility['eligible'],
            'reason': eligibility['reason'],
            'total_prerequisites': eligibility['total_prerequisites'],
            'missing_prerequisites': {
                'count': len(eligibility['missing_prerequisites']),
                'course_ids': eligibility['missing_prerequisites'],
                'courses': missing_details
            },
            'satisfied_prerequisites': {
                'count': len(eligibility['satisfied_prerequisites']),
                'course_ids': eligibility['satisfied_prerequisites'],
                'courses': satisfied_details
            }
        }
        
    except Exception as e:
        logger.error(f"Error checking user eligibility for course {course_id}, user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error checking user eligibility: {str(e)}")

@router.get("/course/{course_id}/stats")
async def get_prerequisite_stats(course_id: int):
    """
    Get prerequisite statistics for a course.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
        SELECT * FROM get_prerequisite_stats(%s)
        """
        
        cursor.execute(query, (course_id,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Course not found")
        
        cursor.close()
        conn.close()
        
        return {
            'course_id': course_id,
            'total_prerequisites': result['total_prereqs'],
            'max_depth': result['max_depth'],
            'average_credits': float(result['avg_credits']) if result['avg_credits'] else None,
            'prerequisite_colleges': result['prereq_colleges'],
            'prerequisite_levels': result['prereq_levels']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching prerequisite stats: {str(e)}")

@router.get("/course/{course_id}/prerequisite-graph")
async def get_prerequisite_graph(
    course_id: int,
    include_user_progress: bool = Query(False, description="Include user progress if authenticated"),
    redis_client: redis.Redis = Depends(get_redis_client)
):
    """
    Fetch prerequisite graph data with enriched course metadata.
    
    This endpoint implements Phase 2 of the prerequisite system:
    - Executes the optimized database query from Phase 1
    - Structures the response for frontend consumption
    - Optionally includes user progress for visual indicators
    - Provides comprehensive error handling and logging
    - Includes Redis caching for performance optimization (Phase 4)
    """
    try:
        # Check cache first if Redis is available
        cache_service = None
        if redis_client:
            cache_service = CacheService(redis_client)
            cache_key = PrerequisiteCacheKeys.graph(course_id, include_user_progress)
            cached_result = await cache_service.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for prerequisite graph: {course_id}")
                return cached_result
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Execute the optimized query from Phase 1
        query = """
        WITH RECURSIVE course_tree AS (
            -- Get the main course and its DAG
            SELECT 
                c.course_id,
                c.course_code,
                c.title,
                c.description,
                c.credits,
                c.level,
                c.college,
                c.last_taught_term,
                p.prereq_dag_json
            FROM courses c
            LEFT JOIN prereq_dags p ON c.course_id = p.course_id
            WHERE c.course_id = %s
        ),
        -- Extract all course IDs from the DAG nodes
        dag_course_ids AS (
            SELECT DISTINCT (node->>'course_id')::int as course_id
            FROM course_tree,
            LATERAL jsonb_array_elements(prereq_dag_json->'nodes') as node
            WHERE prereq_dag_json IS NOT NULL
              AND node->>'course_id' IS NOT NULL
        )
        -- Get metadata for all courses in the DAG plus the main course
        SELECT 
            c.course_id,
            c.course_code,
            c.title,
            c.description,
            c.credits,
            c.level,
            c.college,
            c.last_taught_term,
            ct.prereq_dag_json,
            (c.course_id = %s) as is_main_course
        FROM courses c
        LEFT JOIN course_tree ct ON c.course_id = ct.course_id
        WHERE c.course_id IN (SELECT course_id FROM dag_course_ids)
           OR c.course_id = %s
        ORDER BY is_main_course DESC, c.course_code
        """
        
        cursor.execute(query, (course_id, course_id, course_id))
        rows = cursor.fetchall()
        
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Course with ID {course_id} not found"
            )
        
        # Build response structure
        course_metadata = {}
        prereq_dag = None
        main_course = None
        
        for row in rows:
            course_data = dict(row)
            
            # Build course metadata
            course_metadata[course_data['course_id']] = {
                "course_id": course_data['course_id'],
                "course_code": course_data['course_code'],
                "title": course_data['title'],
                "description": course_data['description'],
                "credits": float(course_data['credits']) if course_data['credits'] else None,
                "level": course_data['level'],
                "college": course_data['college'],
                "last_taught_term": course_data['last_taught_term']
            }
            
            # Get the main course and DAG
            if course_data['is_main_course']:
                main_course = course_metadata[course_data['course_id']]
                prereq_dag = course_data['prereq_dag_json']
        
        # Get user progress if requested
        user_progress = None
        if include_user_progress:
            # TODO: Get actual user_id from authentication
            user_id = "sample_user_id"  # Replace with actual user authentication
            progress_service = UserProgressService(conn)
            user_progress = await progress_service.get_user_course_progress(user_id)
        
        cursor.close()
        conn.close()
        
        # Build the final response
        response = {
            "course_id": course_id,
            "main_course": main_course,
            "dag": prereq_dag,
            "course_metadata": course_metadata,
            "total_courses": len(course_metadata),
            "query_optimization": {
                "strategy": "Phase 2: Optimized API with Structured Response",
                "performance_notes": "Single query with CTEs, structured for frontend consumption"
            }
        }
        
        if user_progress:
            response["user_progress"] = user_progress
        
        # Cache the result if Redis is available
        if cache_service:
            cache_key = PrerequisiteCacheKeys.graph(course_id, include_user_progress)
            ttl = CacheTTL.USER_PROGRESS if include_user_progress else CacheTTL.PREREQ_GRAPH
            await cache_service.set(cache_key, response, ttl)
            logger.info(f"Cached prerequisite graph for course {course_id}")
        
        logger.info(f"Successfully fetched prerequisite graph for course {course_id}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prerequisite graph for course {course_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Internal server error while fetching prerequisite data"
        )

async def get_user_course_progress(cursor, user_id: str) -> Dict[str, List[int]]:
    """
    Helper function to fetch user's course completion status.
    
    This would integrate with your DARS data or user progress table.
    For now, returns sample data for demonstration.
    """
    try:
        # TODO: Replace with actual user progress query
        # Example query:
        # cursor.execute("""
        #     SELECT course_id, status 
        #     FROM user_course_progress 
        #     WHERE user_id = %s
        # """, (user_id,))
        
        # For demonstration, return sample data
        return {
            "completed": [101, 201, 1001],  # course IDs the user has completed
            "in_progress": [301],           # course IDs the user is currently taking
            "planned": [401, 501],          # course IDs the user plans to take
            "failed": []                    # course IDs the user failed
        }
    except Exception as e:
        logger.error(f"Error fetching user progress for user {user_id}: {str(e)}")
        return {
            "completed": [],
            "in_progress": [],
            "planned": [],
            "failed": []
        }

@router.get("/health")
async def health_check():
    """
    Health check endpoint for prerequisite service.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Test the prerequisite functions
        cursor.execute("SELECT get_course_prerequisites(1)")
        cursor.execute("SELECT get_prerequisite_tree(1)")
        cursor.execute("SELECT can_take_course(1, ARRAY[1,2,3])")
        cursor.execute("SELECT get_prerequisite_stats(1)")
        
        cursor.close()
        conn.close()
        
        return {
            'status': 'healthy',
            'service': 'prerequisite-service',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'functions': 'available'
        }
        
    except Exception as e:
        return {
            'status': 'degraded',
            'service': 'prerequisite-service',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'disconnected',
            'error': str(e)
        }

@router.get("/test-graph/{course_id}")
async def get_test_prerequisite_graph(course_id: int):
    """
    Test endpoint that returns mock prerequisite graph data for frontend testing.
    This doesn't require a database connection.
    """
    # Mock data based on the sample data structure
    mock_data = {
        "course_id": course_id,
        "main_course": {
            "course_id": course_id,
            "course_code": f"CS {course_id}",
            "title": f"Test Course {course_id}",
            "description": f"This is a test course with ID {course_id}",
            "credits": 3,
            "level": "Undergraduate",
            "college": "College of Engineering",
            "last_taught_term": "Fall 2024"
        },
        "dag": {
            "nodes": [
                {
                    "id": str(course_id),
                    "course_id": str(course_id),
                    "label": f"CS {course_id}",
                    "type": "course"
                },
                {
                    "id": "101",
                    "course_id": "101",
                    "label": "CS 101",
                    "type": "course"
                },
                {
                    "id": "201",
                    "course_id": "201",
                    "label": "CS 201",
                    "type": "course"
                },
                {
                    "id": "AND1",
                    "label": "AND",
                    "type": "AND"
                }
            ],
            "links": [
                {
                    "from": "101",
                    "to": "AND1"
                },
                {
                    "from": "201",
                    "to": "AND1"
                },
                {
                    "from": "AND1",
                    "to": str(course_id)
                }
            ]
        },
        "course_metadata": {
            str(course_id): {
                "course_id": course_id,
                "course_code": f"CS {course_id}",
                "title": f"Test Course {course_id}",
                "description": f"This is a test course with ID {course_id}",
                "credits": 3,
                "level": "Undergraduate",
                "college": "College of Engineering",
                "last_taught_term": "Fall 2024"
            },
            "101": {
                "course_id": 101,
                "course_code": "CS 101",
                "title": "Introduction to Computer Science",
                "description": "Basic concepts of computer science and programming",
                "credits": 3,
                "level": "Undergraduate",
                "college": "College of Engineering",
                "last_taught_term": "Fall 2024"
            },
            "201": {
                "course_id": 201,
                "course_code": "CS 201",
                "title": "Data Structures",
                "description": "Advanced data structures and algorithms",
                "credits": 3,
                "level": "Undergraduate",
                "college": "College of Engineering",
                "last_taught_term": "Spring 2024"
            }
        },
        "total_courses": 3
    }
    
    return mock_data 

@router.get("/simple-graph/{course_id}")
async def get_simple_prerequisite_graph(course_id: int):
    """
    Simple endpoint that reads directly from prereq_dags table without complex functions.
    This avoids the function bugs and just returns the raw DAG data.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Simple query to get the DAG data
        query = """
        SELECT 
            c.course_id,
            c.course_code,
            c.title,
            c.description,
            c.credits,
            c.level,
            c.college,
            c.last_taught_term,
            p.prereq_dag_json
        FROM courses c
        LEFT JOIN prereq_dags p ON c.course_id = p.course_id
        WHERE c.course_id = %s
        """
        
        cursor.execute(query, (course_id,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Get course metadata for all courses mentioned in the DAG
        dag_data = result['prereq_dag_json']
        course_ids = set()
        
        if dag_data and 'nodes' in dag_data:
            for node in dag_data['nodes']:
                if 'course_id' in node:
                    course_ids.add(int(node['course_id']))
        
        # Add the main course ID
        course_ids.add(course_id)
        
        # Get metadata for all courses
        course_metadata = {}
        if course_ids:
            placeholders = ','.join(['%s'] * len(course_ids))
            metadata_query = f"""
            SELECT course_id, course_code, title, description, credits, level, college, last_taught_term
            FROM courses
            WHERE course_id IN ({placeholders})
            """
            cursor.execute(metadata_query, list(course_ids))
            for row in cursor.fetchall():
                course_metadata[str(row['course_id'])] = {
                    'course_id': row['course_id'],
                    'course_code': row['course_code'],
                    'title': row['title'],
                    'description': row['description'],
                    'credits': float(row['credits']) if row['credits'] else None,
                    'level': row['level'],
                    'college': row['college'],
                    'last_taught_term': row['last_taught_term']
                }
        
        cursor.close()
        conn.close()
        
        return {
            "course_id": course_id,
            "main_course": course_metadata.get(str(course_id), {
                'course_id': result['course_id'],
                'course_code': result['course_code'],
                'title': result['title'],
                'description': result['description'],
                'credits': float(result['credits']) if result['credits'] else None,
                'level': result['level'],
                'college': result['college'],
                'last_taught_term': result['last_taught_term']
            }),
            "dag": dag_data,
            "course_metadata": course_metadata,
            "total_courses": len(course_metadata)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching simple prerequisite graph for course {course_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Internal server error while fetching prerequisite data"
        ) 

@router.get("/reactflow-graph/{course_id}")
async def get_reactflow_prerequisite_graph(course_id: int):
    """
    Get pre-converted React Flow prerequisite graph data.
    This endpoint uses the reactflow_dag_json column for faster responses.
    """
    try:
        logger.info(f"Fetching React Flow data for course {course_id}")
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # First, let's check if the course exists at all
        course_check_query = "SELECT course_id FROM courses WHERE course_id = %s"
        cursor.execute(course_check_query, (course_id,))
        course_exists = cursor.fetchone()
        
        if not course_exists:
            logger.warning(f"Course {course_id} not found in courses table")
            raise HTTPException(status_code=404, detail=f"Course {course_id} not found")
        
        # Check if React Flow data exists
        try:
            check_query = "SELECT has_reactflow_data(%s) as has_data"
            cursor.execute(check_query, (course_id,))
            has_data_result = cursor.fetchone()
            
            if not has_data_result:
                logger.warning(f"has_reactflow_data function returned no result for course {course_id}")
                raise HTTPException(
                    status_code=404, 
                    detail=f"React Flow data not found for course {course_id}. Run the conversion script first."
                )
            
            has_data = has_data_result['has_data']
            logger.info(f"has_reactflow_data result for course {course_id}: {has_data}")
            
            if not has_data:
                raise HTTPException(
                    status_code=404, 
                    detail=f"React Flow data not found for course {course_id}. Run the conversion script first."
                )
        except Exception as check_error:
            logger.error(f"Error checking React Flow data existence for course {course_id}: {str(check_error)}")
            # If the function doesn't exist, let's try a direct query
            direct_check_query = "SELECT reactflow_dag_json FROM prereq_dag WHERE course_id = %s"
            cursor.execute(direct_check_query, (course_id,))
            direct_result = cursor.fetchone()
            
            if not direct_result or not direct_result['reactflow_dag_json']:
                raise HTTPException(
                    status_code=404, 
                    detail=f"React Flow data not found for course {course_id}. Run the conversion script first."
                )
            
            # If we have direct data, use it
            logger.info(f"Found React Flow data directly for course {course_id}")
            reactflow_data = direct_result['reactflow_dag_json']
            
            # Get course metadata
            course_query = "SELECT course_id, course_code, title, credits, level, college, last_taught_term FROM courses WHERE course_id = %s"
            cursor.execute(course_query, (course_id,))
            course_data = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            return {
                "course_id": course_id,
                "main_course": {
                    'course_id': course_data['course_id'],
                    'course_code': course_data['course_code'],
                    'title': course_data['title'],
                    'credits': float(course_data['credits']) if course_data['credits'] else None,
                    'level': course_data['level'],
                    'college': course_data['college'],
                    'last_taught_term': course_data['last_taught_term']
                },
                "reactflow_data": reactflow_data,
                "course_metadata": {str(course_id): {
                    'course_id': course_data['course_id'],
                    'course_code': course_data['course_code'],
                    'title': course_data['title'],
                    'credits': float(course_data['credits']) if course_data['credits'] else None,
                    'level': course_data['level'],
                    'college': course_data['college'],
                    'last_taught_term': course_data['last_taught_term']
                }},
                "total_courses": 1,
                "conversion_status": "pre_converted"
            }
        
        # Get the pre-converted React Flow data using the function
        try:
            query = "SELECT * FROM get_reactflow_prerequisites(%s)"
            cursor.execute(query, (course_id,))
            result = cursor.fetchone()
            
            if not result:
                logger.error(f"get_reactflow_prerequisites function returned no result for course {course_id}")
                raise HTTPException(status_code=404, detail="Course not found")
            
            logger.info(f"Successfully retrieved React Flow data for course {course_id}")
            
        except Exception as func_error:
            logger.error(f"Error calling get_reactflow_prerequisites for course {course_id}: {str(func_error)}")
            # Fallback to direct query
            direct_query = "SELECT reactflow_dag_json FROM prereq_dag WHERE course_id = %s"
            cursor.execute(direct_query, (course_id,))
            direct_result = cursor.fetchone()
            
            if not direct_result:
                raise HTTPException(status_code=404, detail="Course not found")
            
            result = {
                'reactflow_dag_json': direct_result['reactflow_dag_json'],
                'course_id': course_id,
                'course_code': course_exists['course_code'] if 'course_code' in course_exists else None,
                'title': course_exists['title'] if 'title' in course_exists else None,
                'credits': course_exists['credits'] if 'credits' in course_exists else None,
                'level': course_exists['level'] if 'level' in course_exists else None,
                'college': course_exists['college'] if 'college' in course_exists else None,
                'last_taught_term': course_exists['last_taught_term'] if 'last_taught_term' in course_exists else None,
                'course_metadata': {str(course_id): {
                    'course_id': course_id,
                    'course_code': course_exists['course_code'] if 'course_code' in course_exists else None,
                    'title': course_exists['title'] if 'title' in course_exists else None,
                    'credits': float(course_exists['credits']) if course_exists.get('credits') else None,
                    'level': course_exists['level'] if 'level' in course_exists else None,
                    'college': course_exists['college'] if 'college' in course_exists else None,
                    'last_taught_term': course_exists['last_taught_term'] if 'last_taught_term' in course_exists else None,
                }}
            }
        
        cursor.close()
        conn.close()
        
        return {
            "course_id": course_id,
            "main_course": {
                'course_id': result['course_id'],
                'course_code': result['course_code'],
                'title': result['title'],
                'credits': float(result['credits']) if result['credits'] else None,
                'level': result['level'],
                'college': result['college'],
                'last_taught_term': result['last_taught_term']
            },
            "reactflow_data": result['reactflow_dag_json'],
            "course_metadata": result['course_metadata'],
            "total_courses": len(result['course_metadata']) if result['course_metadata'] else 0,
            "conversion_status": "pre_converted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching React Flow prerequisite graph for course {course_id}: {str(e)}")
        logger.exception(f"Full traceback for course {course_id}:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Internal server error while fetching React Flow prerequisite data"
        )

@router.get("/simple-reactflow-graph/{course_id}")
async def get_simple_reactflow_graph(course_id: int):
    """
    Simple fallback endpoint that directly queries the prereq_dag table.
    This doesn't rely on database functions that might not exist.
    """
    try:
        logger.info(f"Fetching simple React Flow data for course {course_id}")
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if course exists
        course_query = "SELECT course_id, course_code, title, credits, level, college FROM courses WHERE course_id = %s"
        cursor.execute(course_query, (course_id,))
        course_data = cursor.fetchone()
        
        if not course_data:
            raise HTTPException(status_code=404, detail=f"Course {course_id} not found")
        
        # Get React Flow data directly from prereq_dag table
        dag_query = "SELECT reactflow_dag_json FROM prereq_dag WHERE course_id = %s"
        cursor.execute(dag_query, (course_id,))
        dag_result = cursor.fetchone()
        
        if not dag_result or not dag_result['reactflow_dag_json']:
            raise HTTPException(
                status_code=404, 
                detail=f"No React Flow data found for course {course_id}"
            )
        
        cursor.close()
        conn.close()
        
        return {
            "course_id": course_id,
            "main_course": {
                'course_id': course_data['course_id'],
                'course_code': course_data['course_code'],
                'title': course_data['title'],
                'credits': float(course_data['credits']) if course_data['credits'] else None,
                'level': course_data['level'],
                'college': course_data['college'],
            },
            "reactflow_data": dag_result['reactflow_dag_json'],
            "course_metadata": {str(course_id): {
                'course_id': course_data['course_id'],
                'course_code': course_data['course_code'],
                'title': course_data['title'],
                'credits': float(course_data['credits']) if course_data['credits'] else None,
                'level': course_data['level'],
                'college': course_data['college'],
            }},
            "total_courses": 1,
            "conversion_status": "simple_fallback"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in simple React Flow endpoint for course {course_id}: {str(e)}")
        logger.exception(f"Full traceback for simple endpoint course {course_id}:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error in simple React Flow endpoint"
        ) 