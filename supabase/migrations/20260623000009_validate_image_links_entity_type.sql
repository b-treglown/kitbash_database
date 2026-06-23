-- Ensure image_links.entity_type is one of the allowed polymorphic targets
-- Adds a trigger that prevents malformed entity_type values

DROP TRIGGER IF EXISTS image_links_entity_type_check ON image_links;
DROP FUNCTION IF EXISTS validate_image_link_entity_type();

CREATE FUNCTION validate_image_link_entity_type()
RETURNS trigger AS $$
BEGIN
  IF NEW.entity_type NOT IN ('figure','part_definition','kitbash') THEN
    RAISE EXCEPTION 'Invalid entity_type % for image_links', NEW.entity_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER image_links_entity_type_check
  BEFORE INSERT OR UPDATE ON image_links
  FOR EACH ROW
  EXECUTE FUNCTION validate_image_link_entity_type();
