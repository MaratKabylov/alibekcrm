'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Task, TaskType } from '@/types/database';
import { X, Calendar, Phone, MessageSquare, Users } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId?: string;
  companyId?: string;
}

export function TaskModal({ isOpen, onClose, dealId, companyId }: TaskModalProps) {
  const { addTask, companies, deals } = useCRM();

  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('call');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('14:00');

  React.useEffect(() => {
    if (isOpen) {
      setDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId || '');
  const [selectedDealId, setSelectedDealId] = useState(dealId || '');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Укажите название задачи');
      return;
    }

    const fullDueDate = new Date(`${dueDate}T${dueTime}:00`).toISOString();

    addTask({
      title,
      task_type: taskType,
      due_date: fullDueDate,
      status: 'pending',
      company_id: selectedCompanyId || null,
      deal_id: selectedDealId || null,
      notes,
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 style={{ fontSize: 17, color: 'var(--text-main)' }}>Новая задача</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Что нужно сделать? *</label>
            <input
              type="text"
              required
              placeholder="Созвониться по утверждению макета стакана"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">Тип задачи</label>
              <select
                className="select"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType)}
              >
                <option value="call">Звонок</option>
                <option value="message">Сообщение / WhatsApp</option>
                <option value="meeting">Встреча</option>
                <option value="other">Другое</option>
              </select>
            </div>
            <div>
              <label className="label">Дата и время</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="date"
                  className="input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <input
                  type="time"
                  className="input"
                  style={{ width: 95 }}
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">Компания</label>
              <select
                className="select"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="">Без привязки</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Сделка</label>
              <select
                className="select"
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(e.target.value)}
              >
                <option value="">Без привязки</option>
                {deals.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Заметки</label>
            <textarea
              rows={2}
              className="textarea"
              placeholder="Детали для подготовки..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Создать задачу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
