-- Ensure Sections are cleaned up on Batch delete
ALTER TABLE batch_sections 
DROP FOREIGN KEY batch_sections_ibfk_1,
ADD CONSTRAINT fk_batch_sections_batch 
FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE;

-- Ensure Student links are cleaned up on Batch delete
ALTER TABLE batch_students 
DROP FOREIGN KEY batch_students_ibfk_1,
ADD CONSTRAINT fk_batch_students_batch 
FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE;