import os
import httpx
import asyncio
from typing import List, Dict, Optional
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class WebSearchService:
    """Service for performing web searches to find real UW-Madison research labs"""
    
    def __init__(self):
        # Support multiple search APIs
        self.serper_api_key = os.getenv("SERPER_API_KEY")
        self.google_api_key = os.getenv("GOOGLE_SEARCH_API_KEY")
        self.bing_api_key = os.getenv("BING_SEARCH_API_KEY")
        
        # Default to Serper API if available
        if self.serper_api_key:
            self.search_provider = "serper"
            self.base_url = "https://google.serper.dev/search"
        elif self.google_api_key:
            self.search_provider = "google"
            self.base_url = "https://www.googleapis.com/customsearch/v1"
        elif self.bing_api_key:
            self.search_provider = "bing"
            self.base_url = "https://api.bing.microsoft.com/v7.0/search"
        else:
            logger.warning("No search API keys configured. Web search will be disabled.")
            self.search_provider = None
    
    async def search(self, query: str, num_results: int = 10) -> List[Dict]:
        """Perform web search and return results"""
        if not self.search_provider:
            logger.warning("No search provider available")
            return []
        
        try:
            if self.search_provider == "serper":
                return await self._search_serper(query, num_results)
            elif self.search_provider == "google":
                return await self._search_google(query, num_results)
            elif self.search_provider == "bing":
                return await self._search_bing(query, num_results)
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return []
    
    async def _search_serper(self, query: str, num_results: int) -> List[Dict]:
        """Search using Serper API"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.base_url,
                headers={"X-API-KEY": self.serper_api_key},
                json={
                    "q": query,
                    "num": num_results,
                    "gl": "us",
                    "hl": "en"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Serper API error: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            return data.get("organic", [])
    
    async def _search_google(self, query: str, num_results: int) -> List[Dict]:
        """Search using Google Custom Search API"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            params = {
                "key": self.google_api_key,
                "cx": os.getenv("GOOGLE_SEARCH_ENGINE_ID"),  # Custom search engine ID
                "q": query,
                "num": min(num_results, 10)  # Google limits to 10
            }
            
            response = await client.get(self.base_url, params=params)
            
            if response.status_code != 200:
                logger.error(f"Google API error: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            items = data.get("items", [])
            
            # Convert to standard format
            return [
                {
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", ""),
                    "displayLink": item.get("displayLink", "")
                }
                for item in items
            ]
    
    async def _search_bing(self, query: str, num_results: int) -> List[Dict]:
        """Search using Bing Search API"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "Ocp-Apim-Subscription-Key": self.bing_api_key
            }
            
            params = {
                "q": query,
                "count": num_results,
                "mkt": "en-US"
            }
            
            response = await client.get(self.base_url, headers=headers, params=params)
            
            if response.status_code != 200:
                logger.error(f"Bing API error: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            web_pages = data.get("webPages", {}).get("value", [])
            
            # Convert to standard format
            return [
                {
                    "title": page.get("name", ""),
                    "link": page.get("url", ""),
                    "snippet": page.get("snippet", ""),
                    "displayLink": page.get("displayUrl", "")
                }
                for page in web_pages
            ]
    
    async def search_uw_madison_labs(self, research_area: str) -> List[Dict]:
        """Search specifically for UW-Madison research labs in a given area"""
        if not self.search_provider:
            logger.warning("No search provider available for UW-Madison lab search")
            return []
        
        # Create targeted search queries for UW-Madison labs
        queries = [
            f'site:wisc.edu "{research_area}" research lab professor contact',
            f'site:cs.wisc.edu "{research_area}" faculty research',
            f'site:engineering.wisc.edu "{research_area}" laboratory',
            f'"UW Madison" "{research_area}" research group principal investigator',
            f'site:wisc.edu "{research_area}" department faculty',
            f'"University of Wisconsin Madison" "{research_area}" research lab'
        ]
        
        all_results = []
        
        # Search with each query
        for query in queries:
            try:
                results = await self.search(query, num_results=5)
                all_results.extend(results)
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.5)
            except Exception as e:
                logger.error(f"Search query failed: {query} - {str(e)}")
                continue
        
        # Remove duplicates based on URL
        seen_urls = set()
        unique_results = []
        for result in all_results:
            url = result.get("link", "")
            if url and url not in seen_urls and "wisc.edu" in url:
                seen_urls.add(url)
                unique_results.append(result)
        
        logger.info(f"Found {len(unique_results)} unique UW-Madison lab results for '{research_area}'")
        return unique_results
    
    async def search_lab_details(self, lab_url: str) -> Dict:
        """Get detailed information about a specific lab"""
        if not self.search_provider:
            return {}
        
        try:
            # Search for the specific lab URL to get more details
            query = f'site:{lab_url} research areas faculty contact'
            results = await self.search(query, num_results=3)
            
            if results:
                return {
                    "url": lab_url,
                    "search_results": results,
                    "found_details": True
                }
            else:
                return {
                    "url": lab_url,
                    "search_results": [],
                    "found_details": False
                }
        except Exception as e:
            logger.error(f"Failed to get lab details for {lab_url}: {str(e)}")
            return {
                "url": lab_url,
                "search_results": [],
                "found_details": False,
                "error": str(e)
            }
    
    def is_search_available(self) -> bool:
        """Check if web search is available"""
        return self.search_provider is not None
    
    def get_search_provider(self) -> Optional[str]:
        """Get the current search provider name"""
        return self.search_provider 