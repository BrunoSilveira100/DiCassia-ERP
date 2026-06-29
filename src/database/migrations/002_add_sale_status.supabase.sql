ALTER TABLE public.vendas
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pago';

ALTER TABLE public.vendas
DROP CONSTRAINT IF EXISTS vendas_status_check;

ALTER TABLE public.vendas
ADD CONSTRAINT vendas_status_check
CHECK (status IN ('Pago', 'Concluído', 'Pendente', 'A Receber', 'Cancelada', 'Agendada'));
