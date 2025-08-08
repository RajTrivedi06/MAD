from typing import Dict, List, Optional, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class UserProgressService:
    """Service for managing user course progress and DARS integration"""
    
    def __init__(self, db_connection):
        self.db_connection = db_connection
    
    async def get_user_course_progress(self, user_id: str) -> Dict[str, List[int]]:
        """
        Get comprehensive user course progress from DARS data and user preferences.
        
        Returns:
            Dict with keys: completed, in_progress, planned, failed
        """
        try:
            cursor = self.db_connection.cursor(cursor_factory=RealDictCursor)
            
            # Get completed courses from DARS data
            completed_courses = await self._get_completed_courses(cursor, user_id)
            
            # Get in-progress courses (current semester)
            in_progress_courses = await self._get_in_progress_courses(cursor, user_id)
            
            # Get planned courses from user preferences
            planned_courses = await self._get_planned_courses(cursor, user_id)
            
            # Get failed courses from DARS data
            failed_courses = await self._get_failed_courses(cursor, user_id)
            
            cursor.close()
            
            return {
                "completed": completed_courses,
                "in_progress": in_progress_courses,
                "planned": planned_courses,
                "failed": failed_courses,
                "last_updated": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching user progress for user {user_id}: {str(e)}")
            return self._get_default_progress()
    
    async def _get_completed_courses(self, cursor, user_id: str) -> List[int]:
        """Extract completed courses from DARS data"""
        try:
            # Query DARS data for completed courses
            query = """
            SELECT DISTINCT course_id
            FROM profiles 
            WHERE id = %s 
            AND dars_data IS NOT NULL
            AND dars_data->>'completed_courses' IS NOT NULL
            """
            
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            
            if result and result['dars_data']:
                dars_data = result['dars_data']
                # Extract completed course IDs from DARS JSON
                completed_courses = dars_data.get('completed_courses', [])
                return [int(course_id) for course_id in completed_courses if course_id]
            
            return []
            
        except Exception as e:
            logger.error(f"Error extracting completed courses: {str(e)}")
            return []
    
    async def _get_in_progress_courses(self, cursor, user_id: str) -> List[int]:
        """Get courses the user is currently taking"""
        try:
            # Query current semester enrollments
            query = """
            SELECT DISTINCT course_id
            FROM profiles 
            WHERE id = %s 
            AND dars_data IS NOT NULL
            AND dars_data->>'current_enrollments' IS NOT NULL
            """
            
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            
            if result and result['dars_data']:
                dars_data = result['dars_data']
                current_enrollments = dars_data.get('current_enrollments', [])
                return [int(course_id) for course_id in current_enrollments if course_id]
            
            return []
            
        except Exception as e:
            logger.error(f"Error extracting in-progress courses: {str(e)}")
            return []
    
    async def _get_planned_courses(self, cursor, user_id: str) -> List[int]:
        """Get courses the user has planned to take"""
        try:
            # Query user preferences for planned courses
            query = """
            SELECT preferences->>'planned_courses' as planned_courses
            FROM profiles 
            WHERE id = %s
            """
            
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            
            if result and result['planned_courses']:
                planned_courses = json.loads(result['planned_courses'])
                return [int(course_id) for course_id in planned_courses if course_id]
            
            return []
            
        except Exception as e:
            logger.error(f"Error extracting planned courses: {str(e)}")
            return []
    
    async def _get_failed_courses(self, cursor, user_id: str) -> List[int]:
        """Get courses the user has failed"""
        try:
            # Query DARS data for failed courses
            query = """
            SELECT DISTINCT course_id
            FROM profiles 
            WHERE id = %s 
            AND dars_data IS NOT NULL
            AND dars_data->>'failed_courses' IS NOT NULL
            """
            
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            
            if result and result['dars_data']:
                dars_data = result['dars_data']
                failed_courses = dars_data.get('failed_courses', [])
                return [int(course_id) for course_id in failed_courses if course_id]
            
            return []
            
        except Exception as e:
            logger.error(f"Error extracting failed courses: {str(e)}")
            return []
    
    def _get_default_progress(self) -> Dict[str, List[int]]:
        """Return default progress structure when data is unavailable"""
        return {
            "completed": [],
            "in_progress": [],
            "planned": [],
            "failed": [],
            "last_updated": datetime.utcnow().isoformat()
        }
    
    async def update_user_progress(self, user_id: str, progress_data: Dict[str, Any]) -> bool:
        """
        Update user's course progress in the database.
        
        Args:
            user_id: User identifier
            progress_data: Dictionary with progress information
            
        Returns:
            bool: Success status
        """
        try:
            cursor = self.db_connection.cursor()
            
            # Update user preferences with new progress data
            query = """
            UPDATE profiles 
            SET 
                preferences = COALESCE(preferences, '{}'::jsonb) || %s::jsonb,
                updated_at = NOW()
            WHERE id = %s
            """
            
            progress_json = json.dumps(progress_data)
            cursor.execute(query, (progress_json, user_id))
            
            self.db_connection.commit()
            cursor.close()
            
            logger.info(f"Updated progress for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating progress for user {user_id}: {str(e)}")
            return False
    
    async def get_course_eligibility(self, user_id: str, course_id: int) -> Dict[str, Any]:
        """
        Check if a user is eligible to take a specific course based on their progress.
        
        Args:
            user_id: User identifier
            course_id: Course to check eligibility for
            
        Returns:
            Dict with eligibility information
        """
        try:
            user_progress = await self.get_user_course_progress(user_id)
            completed_courses = set(user_progress["completed"])
            
            # Get course prerequisites
            cursor = self.db_connection.cursor(cursor_factory=RealDictCursor)
            
            query = """
            SELECT prereq_dag_json
            FROM prereq_dags
            WHERE course_id = %s
            """
            
            cursor.execute(query, (course_id,))
            result = cursor.fetchone()
            
            if not result or not result['prereq_dag_json']:
                cursor.close()
                return {
                    "eligible": True,
                    "missing_prerequisites": [],
                    "satisfied_prerequisites": [],
                    "reason": "No prerequisites found"
                }
            
            # Extract prerequisite course IDs
            prereq_dag = result['prereq_dag_json']
            prerequisite_course_ids = []
            
            if prereq_dag and 'nodes' in prereq_dag:
                for node in prereq_dag['nodes']:
                    if 'course_id' in node:
                        prerequisite_course_ids.append(int(node['course_id']))
            
            cursor.close()
            
            # Check eligibility
            missing_prereqs = [cid for cid in prerequisite_course_ids if cid not in completed_courses]
            satisfied_prereqs = [cid for cid in prerequisite_course_ids if cid in completed_courses]
            
            eligible = len(missing_prereqs) == 0
            
            return {
                "eligible": eligible,
                "missing_prerequisites": missing_prereqs,
                "satisfied_prerequisites": satisfied_prereqs,
                "total_prerequisites": len(prerequisite_course_ids),
                "reason": "All prerequisites satisfied" if eligible else f"Missing {len(missing_prereqs)} prerequisites"
            }
            
        except Exception as e:
            logger.error(f"Error checking eligibility for user {user_id}, course {course_id}: {str(e)}")
            return {
                "eligible": False,
                "missing_prerequisites": [],
                "satisfied_prerequisites": [],
                "reason": "Error checking eligibility"
            } 