-- 040 - Partition Helper
CREATE OR REPLACE FUNCTION create_monthly_partition(p_parent_table TEXT, p_month DATE)
RETURNS TEXT AS $$
DECLARE
  v_name TEXT;
  v_start TEXT;
  v_end TEXT;
BEGIN
  v_name := p_parent_table || '_y' || to_char(p_month, 'YYYY') || 'm' || to_char(p_month, 'MM');
  v_start := to_char(date_trunc('month', p_month), 'YYYY-MM-DD');
  v_end := to_char(date_trunc('month', p_month) + INTERVAL '1 month', 'YYYY-MM-DD');
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    v_name, p_parent_table, v_start, v_end);
  RETURN v_name;
END;
$$ LANGUAGE plpgsql;