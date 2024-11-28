DO $$ 
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'chatbot_appointment') THEN
      PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE chatbot_appointment');
   END IF;
END $$;