SELECT url, authority_score 
FROM public.pages 
ORDER BY authority_score DESC 
LIMIT 5;