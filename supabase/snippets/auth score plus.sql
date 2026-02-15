UPDATE pages
SET authority_score = (
    SELECT count(*)
    FROM links
    WHERE links.to_url = pages.url
) + 1.0;