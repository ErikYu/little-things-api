import dayjs from 'dayjs';

export const getMonthStartEnd = (month: string) => {
  const startDate = dayjs(`${month}-01`).startOf('month');
  const endDate = startDate.endOf('month');
  return {
    startDate: startDate.format('YYYY-MM-DD'),
    endDate: endDate.format('YYYY-MM-DD'),
  };
};
