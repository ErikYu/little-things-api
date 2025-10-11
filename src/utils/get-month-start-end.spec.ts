import { getMonthStartEnd } from './get-month-start-end';

describe('getMonthStartEnd', () => {
  describe('正常月份输入', () => {
    it('应该正确处理2024年1月', () => {
      const result = getMonthStartEnd('2024-01');
      expect(result).toEqual({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });

    it('应该正确处理2024年6月', () => {
      const result = getMonthStartEnd('2024-06');
      expect(result).toEqual({
        startDate: '2024-06-01',
        endDate: '2024-06-30',
      });
    });

    it('应该正确处理2024年12月', () => {
      const result = getMonthStartEnd('2024-12');
      expect(result).toEqual({
        startDate: '2024-12-01',
        endDate: '2024-12-31',
      });
    });
  });

  describe('闰年2月', () => {
    it('应该正确处理2024年2月（闰年）', () => {
      const result = getMonthStartEnd('2024-02');
      expect(result).toEqual({
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      });
    });

    it('应该正确处理2023年2月（平年）', () => {
      const result = getMonthStartEnd('2023-02');
      expect(result).toEqual({
        startDate: '2023-02-01',
        endDate: '2023-02-28',
      });
    });
  });

  describe('边界情况', () => {
    it('应该正确处理2000年2月（世纪闰年）', () => {
      const result = getMonthStartEnd('2000-02');
      expect(result).toEqual({
        startDate: '2000-02-01',
        endDate: '2000-02-29',
      });
    });

    it('应该正确处理1900年2月（世纪平年）', () => {
      const result = getMonthStartEnd('1900-02');
      expect(result).toEqual({
        startDate: '1900-02-01',
        endDate: '1900-02-28',
      });
    });

    it('应该正确处理不同年份的同一个月', () => {
      const result2023 = getMonthStartEnd('2023-03');
      const result2024 = getMonthStartEnd('2024-03');

      expect(result2023).toEqual({
        startDate: '2023-03-01',
        endDate: '2023-03-31',
      });

      expect(result2024).toEqual({
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      });
    });
  });

  describe('不同月份天数', () => {
    it('应该正确处理30天的月份（4月）', () => {
      const result = getMonthStartEnd('2024-04');
      expect(result).toEqual({
        startDate: '2024-04-01',
        endDate: '2024-04-30',
      });
    });

    it('应该正确处理31天的月份（5月）', () => {
      const result = getMonthStartEnd('2024-05');
      expect(result).toEqual({
        startDate: '2024-05-01',
        endDate: '2024-05-31',
      });
    });

    it('应该正确处理30天的月份（9月）', () => {
      const result = getMonthStartEnd('2024-09');
      expect(result).toEqual({
        startDate: '2024-09-01',
        endDate: '2024-09-30',
      });
    });

    it('应该正确处理31天的月份（11月）', () => {
      const result = getMonthStartEnd('2024-11');
      expect(result).toEqual({
        startDate: '2024-11-01',
        endDate: '2024-11-30',
      });
    });
  });

  describe('错误输入处理', () => {
    it('应该处理无效的月份格式', () => {
      // dayjs 会将 'invalid-01' 解释为 '2001-01-01'
      const result = getMonthStartEnd('invalid');
      expect(result).toEqual({
        startDate: '2001-01-01',
        endDate: '2001-01-31',
      });
    });

    it('应该处理不存在的月份', () => {
      // dayjs 会将 2024-13 溢出为 2025-01
      const result = getMonthStartEnd('2024-13');
      expect(result).toEqual({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });
    });

    it('应该处理空字符串', () => {
      // dayjs 会将 '-01' 解释为 '2001-01-01'
      const result = getMonthStartEnd('');
      expect(result).toEqual({
        startDate: '2001-01-01',
        endDate: '2001-01-31',
      });
    });

    it('应该处理月份为0的情况', () => {
      // dayjs 会将 2024-00 处理为 2023-12
      const result = getMonthStartEnd('2024-00');
      expect(result).toEqual({
        startDate: '2023-12-01',
        endDate: '2023-12-31',
      });
    });

    it('应该处理完全无效的日期格式', () => {
      // 测试一个真正会导致 Invalid Date 的情况
      const result = getMonthStartEnd('not-a-date');
      expect(result).toEqual({
        startDate: '2001-01-01',
        endDate: '2001-01-31',
      });
    });
  });

  describe('返回格式验证', () => {
    it('返回的日期格式应该是 YYYY-MM-DD', () => {
      const result = getMonthStartEnd('2024-06');
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(result.startDate).toMatch(dateRegex);
      expect(result.endDate).toMatch(dateRegex);
    });

    it('返回对象应该包含 startDate 和 endDate 属性', () => {
      const result = getMonthStartEnd('2024-06');

      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(typeof result.startDate).toBe('string');
      expect(typeof result.endDate).toBe('string');
    });
  });
});
