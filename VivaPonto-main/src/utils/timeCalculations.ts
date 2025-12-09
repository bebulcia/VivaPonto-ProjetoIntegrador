export function calculateWorkedMinutes(
  entry: string | null | undefined,
  breakStart: string | null | undefined,
  breakEnd: string | null | undefined,
  exit: string | null | undefined
): number {
  if (!entry || !exit) {
    return 0;
  }

  try {
    const entryMinutes = timeToMinutes(entry);
    const exitMinutes = timeToMinutes(exit);

    if (isNaN(entryMinutes) || isNaN(exitMinutes)) {
      return 0;
    }

    let totalMinutes = exitMinutes - entryMinutes;

    if (breakStart && breakEnd) {
      const breakStartMinutes = timeToMinutes(breakStart);
      const breakEndMinutes = timeToMinutes(breakEnd);

      if (!isNaN(breakStartMinutes) && !isNaN(breakEndMinutes)) {
        const breakDuration = breakEndMinutes - breakStartMinutes;
        if (breakDuration > 0) {
          totalMinutes -= breakDuration;
        }
      }
    }

    return totalMinutes > 0 ? totalMinutes : 0;
  } catch (error) {
    console.error('Erro ao calcular minutos trabalhados:', error);
    return 0;
  }
}

export function timeToMinutes(time: string | null | undefined): number {
  if (!time || typeof time !== 'string') {
    return NaN;
  }

  const parts = time.split(':');
  if (parts.length !== 2) {
    return NaN;
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return NaN;
  }

  return hours * 60 + minutes;
}

export function formatMinutesToHours(minutes: number | null | undefined): string {
  if (minutes == null || isNaN(minutes)) {
    return '--';
  }

  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  const sign = minutes < 0 ? '-' : '';
  return `${sign}${hours}h ${mins.toString().padStart(2, '0')}m`;
}

export function calculateBalance(
  workedMinutes: number | null | undefined,
  shiftMinutes: number | null | undefined
): { balance: string; isNegative: boolean; minutes: number } {
  if (
    workedMinutes == null ||
    isNaN(workedMinutes) ||
    shiftMinutes == null ||
    isNaN(shiftMinutes) ||
    !shiftMinutes
  ) {
    return {
      balance: '0h 00m',
      isNegative: false,
      minutes: 0
    };
  }

  const balanceMinutes = workedMinutes - shiftMinutes;

  return {
    balance: formatMinutesToHours(balanceMinutes),
    isNegative: balanceMinutes < 0,
    minutes: balanceMinutes
  };
}

export function formatTime(time: string | null | undefined): string {
  if (!time) {
    return '--';
  }
  return time;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) {
    return '--';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '--';
    }

    return dateObj.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '--';
  }
}

export function safeParseInt(value: any, defaultValue: number = 0): number {
  if (value == null) {
    return defaultValue;
  }

  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
