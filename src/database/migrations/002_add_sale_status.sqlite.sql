ALTER TABLE vendas
ADD COLUMN status TEXT NOT NULL DEFAULT 'Pago'
CHECK (status IN ('Pago', 'Concluído', 'Pendente', 'A Receber', 'Cancelada', 'Agendada'));
