'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Pipeline, DealStage } from '@/types/database';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  GitBranch, 
  Sliders, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Layers
} from 'lucide-react';

interface PipelineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'pipelines' | 'stages';
  targetPipelineId?: string;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#EF4444', // Red
  '#64748B', // Slate
];

export function PipelineSettingsModal({
  isOpen,
  onClose,
  initialTab = 'pipelines',
  targetPipelineId,
}: PipelineSettingsModalProps) {
  const { 
    pipelines, 
    stages, 
    deals, 
    activePipelineId, 
    setActivePipelineId,
    addPipeline, 
    updatePipeline, 
    deletePipeline,
    addStage, 
    updateStage, 
    deleteStage, 
    reorderStages 
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'pipelines' | 'stages'>(initialTab);
  const [selectedPipeId, setSelectedPipeId] = useState<string>(
    targetPipelineId || activePipelineId || pipelines[0]?.id || ''
  );

  // Состояния для создания воронки
  const [isCreatingPipe, setIsCreatingPipe] = useState(false);
  const [newPipeName, setNewPipeName] = useState('');
  const [newPipeDesc, setNewPipeDesc] = useState('');
  const [newPipeIsDefault, setNewPipeIsDefault] = useState(false);
  const [newPipeCopyFrom, setNewPipeCopyFrom] = useState<string>('');

  // Состояния для редактирования воронки
  const [editingPipeId, setEditingPipeId] = useState<string | null>(null);
  const [editPipeName, setEditPipeName] = useState('');
  const [editPipeDesc, setEditPipeDesc] = useState('');
  const [editPipeIsDefault, setEditPipeIsDefault] = useState(false);

  // Состояния для добавления/редактирования статуса
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [stageName, setStageName] = useState('');
  const [stageColor, setStageColor] = useState(PRESET_COLORS[0]);
  const [stageType, setStageType] = useState<'regular' | 'won' | 'lost'>('regular');
  const [editingStageId, setEditingStageId] = useState<string | null>(null);

  // Модалка подтверждения удаления статуса с переносом сделок
  const [deletingStage, setDeletingStage] = useState<DealStage | null>(null);
  const [fallbackStageId, setFallbackStageId] = useState<string>('');

  // Уведомление об ошибке
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPipeline = pipelines.find(p => p.id === selectedPipeId) || pipelines[0];
  const currentStages = stages
    .filter(s => s.pipeline_id === (currentPipeline?.id || ''))
    .sort((a, b) => a.stage_order - b.stage_order);

  // --- Обработчики Воронок ---
  const handleStartCreatePipe = () => {
    setIsCreatingPipe(true);
    setNewPipeName('');
    setNewPipeDesc('');
    setNewPipeIsDefault(false);
    setNewPipeCopyFrom(currentPipeline?.id || '');
    setErrorMessage(null);
  };

  const handleSaveNewPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipeName.trim()) {
      setErrorMessage('Укажите название воронки продаж');
      return;
    }

    const created = addPipeline({
      name: newPipeName.trim(),
      description: newPipeDesc.trim() || undefined,
      is_default: newPipeIsDefault,
      copyStagesFromPipelineId: newPipeCopyFrom || undefined,
    });

    setIsCreatingPipe(false);
    setSelectedPipeId(created.id);
    setActiveTab('stages'); // Переключаем сразу к настройке статусов новой воронки
  };

  const handleStartEditPipe = (pipe: Pipeline) => {
    setEditingPipeId(pipe.id);
    setEditPipeName(pipe.name);
    setEditPipeDesc(pipe.description || '');
    setEditPipeIsDefault(pipe.is_default);
    setErrorMessage(null);
  };

  const handleSaveEditPipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPipeId || !editPipeName.trim()) return;

    updatePipeline(editingPipeId, {
      name: editPipeName.trim(),
      description: editPipeDesc.trim() || null,
      is_default: editPipeIsDefault,
    });

    setEditingPipeId(null);
  };

  const handleDeletePipeline = (pipeId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту воронку?')) return;
    const res = deletePipeline(pipeId);
    if (!res.success) {
      setErrorMessage(res.error || 'Ошибка при удалении воронки');
    } else {
      setSelectedPipeId(pipelines.find(p => p.id !== pipeId)?.id || '');
      setErrorMessage(null);
    }
  };

  // --- Обработчики Статусов ---
  const handleStartAddStage = () => {
    setIsAddingStage(true);
    setEditingStageId(null);
    setStageName('');
    setStageColor(PRESET_COLORS[currentStages.length % PRESET_COLORS.length]);
    setStageType('regular');
    setErrorMessage(null);
  };

  const handleStartEditStage = (stage: DealStage) => {
    setEditingStageId(stage.id);
    setIsAddingStage(true);
    setStageName(stage.name);
    setStageColor(stage.color);
    setStageType(stage.is_won ? 'won' : stage.is_lost ? 'lost' : 'regular');
    setErrorMessage(null);
  };

  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName.trim()) {
      setErrorMessage('Укажите название статуса');
      return;
    }

    const is_won = stageType === 'won';
    const is_lost = stageType === 'lost';

    if (editingStageId) {
      updateStage(editingStageId, {
        name: stageName.trim(),
        color: stageColor,
        is_won,
        is_lost,
      });
    } else {
      if (!currentPipeline) return;
      addStage({
        pipeline_id: currentPipeline.id,
        name: stageName.trim(),
        color: stageColor,
        stage_order: (currentStages.length + 1) * 10,
        is_won,
        is_lost,
      });
    }

    setIsAddingStage(false);
    setEditingStageId(null);
    setStageName('');
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    if (!currentPipeline) return;
    const newStages = [...currentStages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStages.length) return;

    const temp = newStages[index];
    newStages[index] = newStages[targetIndex];
    newStages[targetIndex] = temp;

    reorderStages(currentPipeline.id, newStages.map(s => s.id));
  };

  const handleDeleteStageClick = (stage: DealStage) => {
    const stageDeals = deals.filter(d => d.stage_id === stage.id);
    if (stageDeals.length > 0) {
      // Требуем перенос сделок
      const otherStages = currentStages.filter(s => s.id !== stage.id);
      setDeletingStage(stage);
      setFallbackStageId(otherStages[0]?.id || '');
    } else {
      if (!confirm(`Удалить статус "${stage.name}"?`)) return;
      const res = deleteStage(stage.id);
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка удаления статуса');
      }
    }
  };

  const handleConfirmDeleteWithFallback = () => {
    if (!deletingStage || !fallbackStageId) return;
    const res = deleteStage(deletingStage.id, fallbackStageId);
    if (!res.success) {
      setErrorMessage(res.error || 'Ошибка удаления статуса');
    } else {
      setDeletingStage(null);
      setFallbackStageId('');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: 780, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Шапка модалки */}
        <div className="modal-header" style={{ paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--primary-light, #EFF6FF)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GitBranch size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Настройка воронок и статусов продаж
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Управляйте пайплайнами, этапами сделок и персональными статусами
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Переключатель вкладок */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 20px',
          gap: 16,
          background: '#F8FAFC'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('pipelines'); setErrorMessage(null); }}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              fontWeight: activeTab === 'pipelines' ? 700 : 500,
              color: activeTab === 'pipelines' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${activeTab === 'pipelines' ? 'var(--primary)' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Layers size={15} />
            <span>Воронки продаж ({pipelines.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('stages'); setErrorMessage(null); }}
            style={{
              padding: '12px 6px',
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              fontWeight: activeTab === 'stages' ? 700 : 500,
              color: activeTab === 'stages' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${activeTab === 'stages' ? 'var(--primary)' : 'transparent'}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sliders size={15} />
            <span>Статусы и этапы ({currentStages.length})</span>
          </button>
        </div>

        {/* Сообщения об ошибках */}
        {errorMessage && (
          <div style={{
            margin: '12px 20px 0',
            padding: '10px 14px',
            borderRadius: 6,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Тело модалки */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>

          {/* =================================================================== */}
          {/* ВКЛАДКА 1: ВОРОНКИ ПРОДАЖ */}
          {/* =================================================================== */}
          {activeTab === 'pipelines' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Список воронок продаж</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Каждая воронка имеет свой уникальный цикл продажи и набор этапов
                  </p>
                </div>
                {!isCreatingPipe && (
                  <button className="btn btn-primary btn-sm" onClick={handleStartCreatePipe}>
                    <Plus size={14} />
                    <span>Добавить воронку</span>
                  </button>
                )}
              </div>

              {/* Форма создания новой воронки */}
              {isCreatingPipe && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid var(--primary-border)',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16
                }}>
                  <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--primary)' }}>
                    Создание новой воронки продаж
                  </h5>
                  <form onSubmit={handleSaveNewPipeline}>
                    <div style={{ marginBottom: 12 }}>
                      <label className="label">Название воронки *</label>
                      <input
                        type="text"
                        required
                        className="input"
                        placeholder="Например: Крупный опт / Дистрибуция / Франшиза"
                        value={newPipeName}
                        onChange={(e) => setNewPipeName(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <label className="label">Описание назначения</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Для каких сделок или клиентов используется эта воронка"
                        value={newPipeDesc}
                        onChange={(e) => setNewPipeDesc(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label className="label">Скопировать этапы из</label>
                        <select
                          className="select"
                          value={newPipeCopyFrom}
                          onChange={(e) => setNewPipeCopyFrom(e.target.value)}
                        >
                          <option value="">Стандартные этапы по умолчанию</option>
                          {pipelines.map(p => (
                            <option key={p.id} value={p.id}>Из: {p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', marginTop: 22 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newPipeIsDefault}
                            onChange={(e) => setNewPipeIsDefault(e.target.checked)}
                          />
                          <span>Сделать воронкой по умолчанию</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsCreatingPipe(false)}
                      >
                        Отмена
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        <Check size={14} />
                        <span>Создать воронку</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Список воронок */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pipelines.map(pipe => {
                  const pipeDeals = deals.filter(d => d.pipeline_id === pipe.id);
                  const pipeStages = stages.filter(s => s.pipeline_id === pipe.id);
                  const isEditing = editingPipeId === pipe.id;

                  if (isEditing) {
                    return (
                      <div
                        key={pipe.id}
                        style={{
                          background: '#FFFFFF',
                          border: '2px solid var(--primary)',
                          borderRadius: 8,
                          padding: 14
                        }}
                      >
                        <form onSubmit={handleSaveEditPipe}>
                          <div style={{ marginBottom: 10 }}>
                            <label className="label">Название воронки</label>
                            <input
                              type="text"
                              required
                              className="input"
                              value={editPipeName}
                              onChange={(e) => setEditPipeName(e.target.value)}
                            />
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <label className="label">Описание</label>
                            <input
                              type="text"
                              className="input"
                              value={editPipeDesc}
                              onChange={(e) => setEditPipeDesc(e.target.value)}
                            />
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={editPipeIsDefault}
                                onChange={(e) => setEditPipeIsDefault(e.target.checked)}
                              />
                              <span>Воронка по умолчанию</span>
                            </label>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingPipeId(null)}
                            >
                              Отмена
                            </button>
                            <button type="submit" className="btn btn-primary btn-sm">
                              Сохранить
                            </button>
                          </div>
                        </form>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={pipe.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        padding: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
                            {pipe.name}
                          </span>
                          {pipe.is_default && (
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              background: '#ECFDF5',
                              color: '#047857',
                              padding: '2px 7px',
                              borderRadius: 10,
                              border: '1px solid #A7F3D0'
                            }}>
                              По умолчанию
                            </span>
                          )}
                          {activePipelineId === pipe.id && (
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              padding: '2px 7px',
                              borderRadius: 10
                            }}>
                              Активная в CRM
                            </span>
                          )}
                        </div>

                        {pipe.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {pipe.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
                          <span>Этапов: <strong style={{ color: 'var(--text-main)' }}>{pipeStages.length}</strong></span>
                          <span>Сделок: <strong style={{ color: 'var(--text-main)' }}>{pipeDeals.length}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedPipeId(pipe.id);
                            setActiveTab('stages');
                          }}
                          title="Настроить этапы и статусы этой воронки"
                        >
                          <Sliders size={13} />
                          <span>Статусы ({pipeStages.length})</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStartEditPipe(pipe)}
                          title="Редактировать название воронки"
                        >
                          <Edit2 size={13} />
                        </button>

                        {pipelines.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--rose-danger)' }}
                            onClick={() => handleDeletePipeline(pipe.id)}
                            title="Удалить воронку"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* ВКЛАДКА 2: СТАТУСЫ И ЭТАПЫ ВОРОНКИ */}
          {/* =================================================================== */}
          {activeTab === 'stages' && (
            <div>
              {/* Выбор воронки для настройки ее статусов */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                padding: '10px 14px',
                background: '#F8FAFC',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Настройка статусов для:
                  </label>
                  <select
                    className="select"
                    style={{ width: 'auto', minWidth: 240, fontWeight: 600, color: 'var(--primary)' }}
                    value={selectedPipeId}
                    onChange={(e) => {
                      setSelectedPipeId(e.target.value);
                      setIsAddingStage(false);
                      setEditingStageId(null);
                      setErrorMessage(null);
                    }}
                  >
                    {pipelines.map(p => (
                      <option key={p.id} value={p.id}>{p.name} {p.is_default ? '(По умолчанию)' : ''}</option>
                    ))}
                  </select>
                </div>

                {!isAddingStage && (
                  <button className="btn btn-primary btn-sm" onClick={handleStartAddStage}>
                    <Plus size={14} />
                    <span>Добавить статус</span>
                  </button>
                )}
              </div>

              {/* Форма добавления / редактирования статуса */}
              {isAddingStage && (
                <div style={{
                  background: '#FFFFFF',
                  border: '2px solid var(--primary)',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <h5 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 12, color: 'var(--primary)' }}>
                    {editingStageId ? 'Редактирование статуса сделки' : 'Добавление нового статуса воронки'}
                  </h5>
                  <form onSubmit={handleSaveStage}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <label className="label">Название статуса / этапа *</label>
                        <input
                          type="text"
                          required
                          className="input"
                          placeholder="Например: Запрос образцов, Ожидание оплаты..."
                          value={stageName}
                          onChange={(e) => setStageName(e.target.value)}
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="label">Тип статуса</label>
                        <select
                          className="select"
                          value={stageType}
                          onChange={(e) => setStageType(e.target.value as any)}
                        >
                          <option value="regular">Обычный этап (В работе)</option>
                          <option value="won">Успешный финал (Выиграна)</option>
                          <option value="lost">Отказ / Срыв (Проиграна)</option>
                        </select>
                      </div>
                    </div>

                    {/* Выбор цвета */}
                    <div style={{ marginBottom: 16 }}>
                      <label className="label">Цвет этапа</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {PRESET_COLORS.map(c => (
                          <div
                            key={c}
                            onClick={() => setStageColor(c)}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: c,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: stageColor === c ? '2px solid #0F172A' : '2px solid transparent',
                              transform: stageColor === c ? 'scale(1.15)' : 'scale(1)',
                              transition: 'transform 0.15s ease'
                            }}
                          >
                            {stageColor === c && <Check size={12} color="#FFFFFF" />}
                          </div>
                        ))}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Свой:</span>
                          <input
                            type="color"
                            value={stageColor}
                            onChange={(e) => setStageColor(e.target.value)}
                            style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setIsAddingStage(false);
                          setEditingStageId(null);
                        }}
                      >
                        Отмена
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        <Check size={14} />
                        <span>{editingStageId ? 'Сохранить изменения' : 'Добавить статус'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Список статусов выбранной воронки */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentStages.map((stage, idx) => {
                  const stageDeals = deals.filter(d => d.stage_id === stage.id);

                  return (
                    <div
                      key={stage.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Кнопки порядка */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveStage(idx, 'up')}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: idx === 0 ? '#CBD5E1' : '#64748B',
                              cursor: idx === 0 ? 'default' : 'pointer',
                              padding: 0
                            }}
                            title="Поднять выше"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === currentStages.length - 1}
                            onClick={() => handleMoveStage(idx, 'down')}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: idx === currentStages.length - 1 ? '#CBD5E1' : '#64748B',
                              cursor: idx === currentStages.length - 1 ? 'default' : 'pointer',
                              padding: 0
                            }}
                            title="Опустить ниже"
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>

                        {/* Индикатор цвета */}
                        <div style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          backgroundColor: stage.color,
                          flexShrink: 0
                        }} />

                        {/* Название и свойства */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>
                              {stage.name}
                            </span>

                            {stage.is_won && (
                              <span style={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                background: '#ECFDF5',
                                color: '#047857',
                                padding: '2px 6px',
                                borderRadius: 10,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <CheckCircle2 size={11} />
                                <span>Выиграна</span>
                              </span>
                            )}

                            {stage.is_lost && (
                              <span style={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                background: '#FEF2F2',
                                color: '#DC2626',
                                padding: '2px 6px',
                                borderRadius: 10,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <XCircle size={11} />
                                <span>Проиграна</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          fontSize: 12,
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontWeight: 600
                        }}>
                          {stageDeals.length} сделок
                        </span>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStartEditStage(stage)}
                            title="Редактировать статус"
                          >
                            <Edit2 size={13} />
                          </button>

                          {currentStages.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--rose-danger)' }}
                              onClick={() => handleDeleteStageClick(stage)}
                              title="Удалить статус"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {currentStages.length === 0 && (
                  <div style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    border: '1px dashed #CBD5E1',
                    borderRadius: 8,
                    color: 'var(--text-muted)'
                  }}>
                    В этой воронке пока нет статусов. Добавьте первый этап!
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Футер модалки */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#F8FAFC'
        }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Готово
          </button>
        </div>

      </div>

      {/* Диалог подтверждения удаления статуса со сделками */}
      {deletingStage && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={20} color="var(--rose-danger)" />
                <h3 style={{ fontSize: 16, margin: 0, color: 'var(--text-main)' }}>
                  Перенос сделок перед удалением
                </h3>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              В статусе <strong>«{deletingStage.name}»</strong> находится{' '}
              <strong>{deals.filter(d => d.stage_id === deletingStage.id).length}</strong> сделок.
              Выберите статус, в который их необходимо перенести:
            </p>

            <div style={{ marginBottom: 18 }}>
              <label className="label">Перенести сделки в статус:</label>
              <select
                className="select"
                value={fallbackStageId}
                onChange={(e) => setFallbackStageId(e.target.value)}
              >
                {currentStages
                  .filter(s => s.id !== deletingStage.id)
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingStage(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDeleteWithFallback}
              >
                Перенести и удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

