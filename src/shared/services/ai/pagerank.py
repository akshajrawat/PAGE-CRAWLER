import os
import networkx as nx
from supabase import create_client, Client
from dotenv import load_dotenv

# load env variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") 

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def calculate_pagerank():
    print("🚀 Starting True PageRank calculation...")
    
    # Fetch links and join with the pages table to get the source URL
    # Supabase syntax: pages(url) traverses the foreign key on from_id
    print("📥 Fetching link graph from Supabase...")
    links_response = supabase.table("links").select("pages(url), to_url").execute()
    links_data = links_response.data
    
    if not links_data:
        print("⚠️ No links found. Aborting PageRank calculation.")
        return

    # Build the Graph
    print(f"Building graph with {len(links_data)} edges...")
    G = nx.DiGraph()
    
    for link in links_data:
        # Extract the source_url from the joined 'pages' object
        # If the page was deleted but the link remains (shouldn't happen due to cascade), we skip
        source_url = link.get("pages", {}).get("url") if link.get("pages") else None
        target_url = link.get("to_url")
        
        if source_url and target_url:
            G.add_edge(source_url, target_url)
        
    print(f"Graph created: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges.")

    # Calculate PageRank!
    print("Calculating PageRank scores...")
    pagerank_scores = nx.pagerank(G, alpha=0.85)

    # Batch Update Supabase
    print("Pushing updated scores to database...")
    updates = []
    scale_factor = len(G.nodes) 
    
    for url, score in pagerank_scores.items():
        scaled_score = score * scale_factor
        updates.append({
            "url": url,
            "authority_score": scaled_score
        })

    # 5. Push in batches of 1000 to prevent hitting Supabase payload limits
    batch_size = 1000
    for i in range(0, len(updates), batch_size):
        batch = updates[i:i + batch_size]
        supabase.table("pages").upsert(batch, on_conflict="url").execute()
        
    print(f"✅ Successfully updated {len(updates)} pages with True PageRank scores!")

if __name__ == "__main__":
    calculate_pagerank()