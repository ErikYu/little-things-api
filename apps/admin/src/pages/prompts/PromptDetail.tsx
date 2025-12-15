import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';

interface Prompt {
  id: string;
  category: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PromptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);

  const isNew = id === 'new';

  useEffect(() => {
    if (isNew) {
      setContent('');
      setActive(true);
      setLoading(false);
      setIsEditing(true);
      return;
    }

    const fetchPrompt = async () => {
      setLoading(true);
      setError('');
      try {
        const data: Prompt = await api.get(`/admin-prompt/${id}`);
        setPrompt(data);
        setContent(data.content);
        setActive(data.active);
      } catch (err: any) {
        setError(
          err.response?.data?.msg ||
            err.response?.data?.message ||
            '获取详情失败',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await api.post('/admin-prompt', {
          category: 'ICON_GENERATION',
          content,
          active,
        });
      } else {
        await api.put(`/admin-prompt/${id}`, {
          content,
          active,
        });
      }
      navigate('/prompts');
    } catch (err: any) {
      setError(
        err.response?.data?.msg || err.response?.data?.message || '保存失败',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isNew ? '新建Prompt' : 'Prompt详情'}
        </h2>
        <Link
          to="/prompts"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          返回列表
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        {!isNew && prompt && (
          <div className="mb-6 space-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">ID:</span> {prompt.id}
            </div>
            <div>
              <span className="font-medium">分类:</span> {prompt.category}
            </div>
            <div>
              <span className="font-medium">创建时间:</span>{' '}
              {new Date(prompt.created_at).toLocaleString('zh-CN')}
            </div>
            <div>
              <span className="font-medium">更新时间:</span>{' '}
              {new Date(prompt.updated_at).toLocaleString('zh-CN')}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={!isEditing}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                disabled={!isEditing}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">启用</span>
            </label>
          </div>

          {isEditing && (
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              {!isNew && prompt && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setContent(prompt.content);
                    setActive(prompt.active);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
              )}
            </div>
          )}

          {!isEditing && !isNew && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              编辑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
