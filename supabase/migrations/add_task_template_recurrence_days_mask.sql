-- Add weekly recurrence bitmask to task templates
-- 0..127 bitmask (bit 0 = Sunday, 6 = Saturday)
alter table task_templates
  add column if not exists recurrence_days_mask integer null
  check (recurrence_days_mask is null or (recurrence_days_mask >= 0 and recurrence_days_mask <= 127));
