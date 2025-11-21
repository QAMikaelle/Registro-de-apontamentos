import React, { useState, useEffect } from 'react';
import { Clock, Percent, BarChart3, Users, Calendar, History, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

export default function HoursPercentageCalculator() {
  const [workTime, setWorkTime] = useState('8:30');
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Raposo', hours: '', dailyGoal: '8:30' },
    { id: 2, name: 'Mika', hours: '', dailyGoal: '8:30' },
    { id: 3, name: 'Luiz', hours: '', dailyGoal: '8:30' },
    { id: 4, name: 'Schutz', hours: '', dailyGoal: '6:00' },
    { id: 5, name: 'Caio', hours: '', dailyGoal: '6:00' },
    { id: 6, name: 'Thiago', hours: '', dailyGoal: '6:00' }
  ]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  // Carregar histórico do storage ao iniciar
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const result = await window.storage.get('work-hours-history');
      if (result && result.value) {
        setHistory(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('Nenhum histórico encontrado');
    }
  };

  const saveToHistory = async () => {
    const hasData = employees.some(emp => emp.hours && emp.hours.includes(':'));
    if (!hasData) {
      alert('⚠️ Preencha as horas de pelo menos um funcionário!');
      return;
    }

    const dailyRecord = {
      date: currentDate,
      employees: employees.map(emp => ({
        name: emp.name,
        hours: emp.hours,
        dailyGoal: emp.dailyGoal,
        percentage: emp.hours ? getNumericPercentage(emp.hours, emp.dailyGoal) : 0
      })),
      averagePercentage: parseFloat(calculateAveragePercentage().replace(',', '.')),
      averageTime: calculateAverageTime()
    };

    try {
      const storageResult = await window.storage.get('work-hours-history');
      const currentHistory = storageResult && storageResult.value ? JSON.parse(storageResult.value) : [];
      
      console.log('Salvando dia:', currentDate);
      console.log('Histórico atual:', currentHistory.map(h => h.date));
      
      // Remove todas as entradas com a mesma data
      const filteredHistory = currentHistory.filter(h => h.date !== currentDate);
      
      console.log('Após filtrar:', filteredHistory.map(h => h.date));
      
      // Adiciona o novo registro
      const newHistory = [...filteredHistory, dailyRecord].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );

      console.log('Novo histórico:', newHistory.map(h => h.date));

      await window.storage.set('work-hours-history', JSON.stringify(newHistory));
      setHistory(newHistory);
      
      const wasUpdate = currentHistory.some(h => h.date === currentDate);
      alert(wasUpdate ? `✅ Dia ${formatDate(currentDate)} atualizado!` : `✅ Dia ${formatDate(currentDate)} salvo!`);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('❌ Erro: ' + error.message);
    }
  };

  const timeToMinutes = (time) => {
    if (!time || !time.includes(':')) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const calculatePercentage = (workedTime, goalTime) => {
    const goalMinutes = timeToMinutes(goalTime);
    const workedMinutes = timeToMinutes(workedTime);
    if (goalMinutes === 0) return 0;
    return ((workedMinutes / goalMinutes) * 100).toFixed(1).replace('.', ',');
  };

  const getNumericPercentage = (workedTime, goalTime) => {
    const goalMinutes = timeToMinutes(goalTime);
    const workedMinutes = timeToMinutes(workedTime);
    if (goalMinutes === 0) return 0;
    return ((workedMinutes / goalMinutes) * 100);
  };

  const calculateAverageTime = () => {
    const validEmployees = employees.filter(emp => emp.hours && emp.hours.includes(':'));
    if (validEmployees.length === 0) return '0:00';
    
    const totalMinutes = validEmployees.reduce((sum, emp) => sum + timeToMinutes(emp.hours), 0);
    const avgMinutes = Math.round(totalMinutes / validEmployees.length);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateAveragePercentage = () => {
    const validEmployees = employees.filter(emp => emp.hours && emp.hours.includes(':'));
    if (validEmployees.length === 0) return '0,0';
    
    const totalPercentage = validEmployees.reduce((sum, emp) => sum + getNumericPercentage(emp.hours, emp.dailyGoal), 0);
    const avg = (totalPercentage / validEmployees.length).toFixed(1);
    return avg.replace('.', ',');
  };

  const getChartData = () => {
    return employees
      .filter(emp => emp.hours && emp.hours.includes(':'))
      .map(emp => ({
        name: emp.name || 'Sem nome',
        percentage: getNumericPercentage(emp.hours, emp.dailyGoal),
        displayPercentage: calculatePercentage(emp.hours, emp.dailyGoal),
        goal: emp.dailyGoal,
        hours: emp.hours
      }));
  };

  const CustomBarLabel = (props) => {
    const { x, y, width, index } = props;
    const data = getChartData();
    if (!data[index]) return null;
    
    return (
      <g>
        <text
          x={x + width / 2}
          y={y - 10}
          fill="#1f2937"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
        >
          {data[index].hours}
        </text>
        <text
          x={x + width / 2}
          y={y + 25}
          fill="#ffffff"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
        >
          {data[index].displayPercentage}%
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border-2 border-indigo-200">
          <p className="font-semibold text-gray-800">{payload[0].payload.name}</p>
          <p className="text-indigo-600 font-bold">{payload[0].payload.displayPercentage}%</p>
          <p className="text-sm text-gray-500">Meta: {payload[0].payload.goal}</p>
        </div>
      );
    }
    return null;
  };

  const addEmployee = () => {
    setEmployees([...employees, { id: Date.now(), name: '', hours: '', dailyGoal: '8:30' }]);
  };

  const removeEmployee = (id) => {
    if (employees.length > 1) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const updateEmployee = (id, field, value) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    ));
  };

  const formatTimeInput = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 4 dígitos
    const limited = numbers.slice(0, 4);
    
    // Adiciona os dois pontos automaticamente
    if (limited.length <= 2) {
      return limited;
    }
    return `${limited.slice(0, 2)}:${limited.slice(2)}`;
  };

  const handleTimeChange = (id, value) => {
    const formatted = formatTimeInput(value);
    updateEmployee(id, 'hours', formatted);
  };

  const handleKeyDown = (e, currentIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < employees.length) {
        const nextInput = document.getElementById(`hours-input-${nextIndex}`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    }
  };

  const getWeekData = () => {
    // Retornar TODOS os dias do histórico, ordenados do mais antigo para o mais recente
    return [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getMonthData = () => {
    // Retornar TODOS os dias do histórico, ordenados do mais antigo para o mais recente
    return [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  };



  const calculateMonthlyAverage = () => {
    const monthData = getMonthData();
    if (monthData.length === 0) return '0,0';
    const avg = monthData.reduce((sum, day) => sum + (day.averagePercentage || 0), 0) / monthData.length;
    return avg.toFixed(1).replace('.', ',');
  };

  const calculateWeeklyAverageCorrected = () => {
    const weekData = getWeekData();
    if (weekData.length === 0) return '0,0';
    const avg = weekData.reduce((sum, day) => sum + (day.averagePercentage || 0), 0) / weekData.length;
    return avg.toFixed(1).replace('.', ',');
  };

  const exportToExcel = () => {
    if (history.length === 0) {
      alert('Não há dados para exportar!');
      return;
    }

    // Criar cabeçalho com BOM para UTF-8
    let csv = '\uFEFF'; // BOM para Excel reconhecer UTF-8
    csv += 'Data;Média do Dia (%);Tempo Médio;Meta Atingida;Funcionário;Horas Trabalhadas;Meta Diária;Porcentagem Individual (%)\n';
    
    // Adicionar dados
    history.forEach(day => {
      const metaAtingida = day.averagePercentage >= 90 ? 'Sim' : 'Não';
      day.employees.forEach(emp => {
        csv += `${formatDate(day.date)};${day.averagePercentage.toFixed(1).replace('.', ',')};${day.averageTime};${metaAtingida};${emp.name};${emp.hours};${emp.dailyGoal};${emp.percentage.toFixed(1).replace('.', ',')}\n`;
      });
    });

    // Criar blob e fazer download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_horas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ Relatório exportado com sucesso!\n\n📊 Total de dias: ${history.length}\n📁 Arquivo: relatorio_horas_${new Date().toISOString().split('T')[0]}.csv\n\n💡 Dica: Abra o arquivo no Excel para melhor visualização.`);
  };

  const importFromExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Pular cabeçalho (primeira linha)
        const dataLines = lines.slice(1);
        
        // Agrupar por data
        const daysByDate = {};
        
        dataLines.forEach(line => {
          const parts = line.split(';').map(p => p.trim());
          if (parts.length < 8) return; // Ignorar linhas incompletas
          
          const [dataStr, mediaStr, tempoMedio, metaAtingida, funcionario, horasTrabalhadas, metaDiaria, percentualStr] = parts;
          
          // Converter data de DD/MM/YYYY para YYYY-MM-DD
          const [day, month, year] = dataStr.split('/');
          const dateKey = `${year}-${month}-${day}`;
          
          if (!daysByDate[dateKey]) {
            daysByDate[dateKey] = {
              date: dateKey,
              employees: [],
              averageTime: tempoMedio
            };
          }
          
          // Adicionar funcionário
          const percentage = parseFloat(percentualStr.replace(',', '.'));
          daysByDate[dateKey].employees.push({
            name: funcionario,
            hours: horasTrabalhadas,
            dailyGoal: metaDiaria,
            percentage: percentage
          });
        });
        
        // Calcular média de cada dia e adicionar ao histórico
        const newDays = Object.values(daysByDate).map(day => {
          const totalPercentage = day.employees.reduce((sum, emp) => sum + emp.percentage, 0);
          const avgPercentage = totalPercentage / day.employees.length;
          
          return {
            ...day,
            averagePercentage: avgPercentage
          };
        });
        
        // Mesclar com histórico existente (substituir dias duplicados)
        const existingDates = new Set(history.map(h => h.date));
        const daysToAdd = newDays.filter(d => !existingDates.has(d.date));
        
        const updatedHistory = [...history, ...daysToAdd].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        setHistory(updatedHistory);
        
        // Salvar no storage
        await window.storage.set('work-hours-history', JSON.stringify(updatedHistory));
        
        alert(`✅ Importação concluída!\n\n📥 Dias importados: ${daysToAdd.length}\n📊 Total de dias no histórico: ${updatedHistory.length}\n\n${daysToAdd.length === 0 ? '⚠️ Todos os dias já estavam registrados.' : ''}`);
        
        // Limpar input
        event.target.value = '';
        
      } catch (error) {
        alert('❌ Erro ao importar arquivo!\n\nVerifique se o arquivo está no formato correto (mesmo formato do arquivo exportado).\n\nErro: ' + error.message);
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const loadHistoricalDay = (date) => {
    const dayData = history.find(h => h.date === date);
    if (dayData) {
      // Atualizar funcionários com os dados históricos, mantendo a meta diária de cada um
      const updatedEmployees = employees.map(emp => {
        const histEmp = dayData.employees.find(e => e.name === emp.name);
        if (histEmp) {
          return { ...emp, hours: histEmp.hours, dailyGoal: histEmp.dailyGoal };
        }
        return { ...emp, hours: '' };
      });
      
      setEmployees(updatedEmployees);
      setCurrentDate(date);
      setShowHistory(false);
      
      console.log('Dia carregado para edição:', date);
    }
  };

  const clearCurrentDay = () => {
    setEmployees(employees.map(emp => ({ ...emp, hours: '' })));
    setCurrentDate(new Date().toISOString().split('T')[0]);
  };

  const deleteDay = async (date) => {
    try {
      console.log('Excluindo dia:', date);
      
      // Carregar histórico atual do storage
      const storageResult = await window.storage.get('work-hours-history');
      const currentHistory = storageResult && storageResult.value ? JSON.parse(storageResult.value) : [];
      
      console.log('Histórico antes:', currentHistory.length, 'dias');
      
      // Filtrar removendo o dia específico
      const newHistory = currentHistory.filter(h => h.date !== date);
      
      console.log('Histórico depois:', newHistory.length, 'dias');
      
      // Salvar de volta no storage
      await window.storage.set('work-hours-history', JSON.stringify(newHistory));
      
      // Atualizar o estado local
      setHistory(newHistory);
      
      alert(`✅ Dia ${formatDate(date)} excluído!`);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('❌ Erro: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Calculadora de Horas Trabalhadas
            </h1>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`ml-auto px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                showHistory ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }`}
            >
              <History className="w-5 h-5" />
              {showHistory ? 'Voltar' : 'Ver Histórico'}
            </button>
          </div>

          {!showHistory ? (
            <>
          {/* Seletor de Data */}
          <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📅 Data do Apontamento
                </label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg text-lg font-semibold focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selecione a data para adicionar ou editar o apontamento
                </p>
              </div>
              
              {history.find(h => h.date === currentDate) && (
                <div className="px-4 py-2 bg-amber-100 border-2 border-amber-300 rounded-lg text-center">
                  <span className="text-amber-800 font-bold text-sm">⚠️ Dia já registrado</span>
                  <p className="text-xs text-amber-700 mt-1">Salvar irá atualizar</p>
                </div>
              )}
              
              <button
                onClick={clearCurrentDay}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors border-2 border-gray-300"
              >
                🆕 Novo Dia
              </button>
            </div>
          </div>

          {/* Jornada de Trabalho e Meta */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="p-6 bg-indigo-50 rounded-xl">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jornada de Trabalho Padrão
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  value={workTime}
                  onChange={(e) => setWorkTime(e.target.value)}
                  placeholder="8:30"
                  className="px-4 py-3 border-2 border-indigo-200 rounded-lg w-32 text-lg font-semibold focus:outline-none focus:border-indigo-500"
                />
                <span className="text-gray-600">
                  ({timeToMinutes(workTime)} minutos)
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Exemplos comuns: 8:30 ou 6:00
              </p>
            </div>

            <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎯 Meta da Equipe
              </label>
              <div className="flex items-center gap-2">
                <span className="text-5xl font-bold text-green-600">90%</span>
              </div>
              <p className="text-sm text-green-700 mt-2 font-medium">
                Objetivo diário de produtividade
              </p>
            </div>
          </div>

          {/* Lista de Funcionários */}
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Funcionários
            </h2>
            
            {employees.map((employee, index) => {
              const percentage = calculatePercentage(employee.hours, employee.dailyGoal);
              
              return (
                <div key={employee.id} className="flex gap-4 items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={employee.name}
                      onChange={(e) => updateEmployee(employee.id, 'name', e.target.value)}
                      placeholder={`Funcionário ${index + 1}`}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="w-28">
                    <label className="text-xs text-gray-500 block mb-1">Meta Diária</label>
                    <input
                      type="text"
                      value={employee.dailyGoal}
                      onChange={(e) => updateEmployee(employee.id, 'dailyGoal', formatTimeInput(e.target.value))}
                      placeholder="8:30"
                      maxLength={5}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-center focus:outline-none focus:border-indigo-500 font-semibold text-gray-700"
                    />
                  </div>
                  
                  <div className="w-32">
                    <label className="text-xs text-gray-500 block mb-1">Horas Trabalhadas</label>
                    <input
                      id={`hours-input-${index}`}
                      type="text"
                      value={employee.hours}
                      onChange={(e) => handleTimeChange(employee.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      placeholder="00:00"
                      maxLength={5}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-center focus:outline-none focus:border-indigo-500 font-mono text-lg"
                    />
                  </div>

                  <div className="w-32 flex items-center justify-center gap-2 bg-indigo-100 rounded-lg py-2 px-4">
                    <span className="text-xl font-bold text-indigo-600">
                      {employee.hours ? `${percentage}%` : '-'}
                    </span>
                  </div>

                  <button
                    onClick={() => removeEmployee(employee.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-semibold"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={addEmployee}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            + Adicionar Funcionário
          </button>

          {/* Botão Salvar Dia */}
          <button
            onClick={saveToHistory}
            className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {history.find(h => h.date === currentDate) 
              ? `Atualizar Dia ${formatDate(currentDate)}` 
              : `Salvar Dia ${formatDate(currentDate)}`}
          </button>

          {/* Estatísticas e Gráfico */}
          {getChartData().length > 0 && (
            <div className="mt-8 space-y-6">
              {/* Média da Equipe */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-700">Tempo Médio</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    {calculateAverageTime()}
                  </p>
                </div>

                <div className={`p-6 bg-gradient-to-br rounded-xl border-2 ${
                  parseFloat(calculateAveragePercentage().replace(',', '.')) >= 90 
                    ? 'from-green-50 to-green-100 border-green-300' 
                    : 'from-red-50 to-red-100 border-red-300'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className={`w-5 h-5 ${
                      parseFloat(calculateAveragePercentage().replace(',', '.')) >= 90 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`} />
                    <h3 className="font-semibold text-gray-700">Média da Equipe</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-3xl font-bold ${
                      parseFloat(calculateAveragePercentage().replace(',', '.')) >= 90 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {calculateAveragePercentage()}%
                    </p>
                    {parseFloat(calculateAveragePercentage().replace(',', '.')) >= 90 ? (
                      <span className="text-green-600 font-bold text-lg">✓ Meta atingida!</span>
                    ) : (
                      <span className="text-red-600 font-bold text-lg">
                        Faltam {(90 - parseFloat(calculateAveragePercentage().replace(',', '.'))).toFixed(1).replace('.', ',')}%
                      </span>
                    )}
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        parseFloat(calculateAveragePercentage().replace(',', '.')) >= 90 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(parseFloat(calculateAveragePercentage().replace(',', '.')), 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span className="font-bold text-green-600">Meta: 90%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Gráfico */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-6 h-6 text-slate-600" />
                  <h3 className="text-xl font-semibold text-gray-800">
                    Porcentagem Trabalhada por Funcionário
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={getChartData()} margin={{ top: 50, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#4b5563', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: '#4b5563', fontSize: 12 }}
                      label={{ value: 'Porcentagem (%)', angle: -90, position: 'insideLeft', fill: '#4b5563' }}
                      domain={[0, 110]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="percentage" radius={[8, 8, 0, 0]} label={<CustomBarLabel />}>
                      {getChartData().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.percentage >= 90 ? '#10b981' : '#ef4444'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 justify-center mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-gray-600">Meta Atingida (≥90%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-gray-600">Meta Não Atingida (&lt;90%)</span>
                  </div>
                </div>

                {/* Tabela de Porcentagens */}
                <div className="mt-6 bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b-2 border-gray-200">
                    <h4 className="font-semibold text-gray-700">Detalhes por Funcionário</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
                    {getChartData().map((emp, index) => (
                      <div 
                        key={index} 
                        className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-700 text-sm">{emp.name}</span>
                          <div 
                            className="px-2 py-1 rounded font-bold text-sm"
                            style={{
                              backgroundColor: emp.percentage >= 90 ? '#dcfce7' : '#fee2e2',
                              color: emp.percentage >= 90 ? '#166534' : '#991b1b'
                            }}
                          >
                            {emp.displayPercentage}%
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Meta: {emp.goal}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legenda */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Como usar:</strong> Selecione a data do apontamento acima. Cada funcionário tem sua meta diária pré-definida (Raposo, Mika e Luiz: 8:30h | Schutz, Caio e Thiago: 6:00h). 
              Insira as horas trabalhadas e clique em "Salvar" para registrar ou atualizar. Use "Ver Histórico" para consultar registros anteriores e "Novo Dia" para limpar os campos.
            </p>
          </div>
          </>
          ) : (
            <div className="space-y-6">
              {/* Estatísticas de Período */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-6 bg-gradient-to-br rounded-xl border-2 ${
                  parseFloat(calculateWeeklyAverageCorrected().replace(',', '.')) >= 90
                    ? 'from-green-50 to-green-100 border-green-200'
                    : 'from-red-50 to-red-100 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className={`w-5 h-5 ${
                      parseFloat(calculateWeeklyAverageCorrected().replace(',', '.')) >= 90
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`} />
                    <h3 className="font-semibold text-gray-700">Média Semanal (7 dias)</h3>
                  </div>
                  <p className={`text-3xl font-bold ${
                    parseFloat(calculateWeeklyAverageCorrected().replace(',', '.')) >= 90
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>{calculateWeeklyAverageCorrected()}%</p>
                  <p className="text-sm text-gray-600 mt-1">{getWeekData().length} dias registrados</p>
                </div>

                <div className={`p-6 bg-gradient-to-br rounded-xl border-2 ${
                  parseFloat(calculateMonthlyAverage().replace(',', '.')) >= 90
                    ? 'from-green-50 to-green-100 border-green-200'
                    : 'from-red-50 to-red-100 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className={`w-5 h-5 ${
                      parseFloat(calculateMonthlyAverage().replace(',', '.')) >= 90
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`} />
                    <h3 className="font-semibold text-gray-700">Média Mensal</h3>
                  </div>
                  <p className={`text-3xl font-bold ${
                    parseFloat(calculateMonthlyAverage().replace(',', '.')) >= 90
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>{calculateMonthlyAverage()}%</p>
                  <p className="text-sm text-gray-600 mt-1">{getMonthData().length} dias registrados</p>
                </div>
              </div>

              {/* Botão de Exportar */}
              <button
                onClick={exportToExcel}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                📊 Exportar Relatório Completo (Excel/CSV)
              </button>

              {/* Botão de Importar */}
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={importFromExcel}
                  id="import-file"
                  className="hidden"
                />
                <label
                  htmlFor="import-file"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-5 h-5" />
                  📥 Importar Dias do Excel/CSV
                </label>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>💡 Como importar:</strong> Use um arquivo CSV no mesmo formato do exportado. 
                  Apenas dias novos serão adicionados (dias já existentes não serão duplicados).
                </p>
              </div>

              {/* Gráfico de Evolução Semanal */}
              {getWeekData().length > 0 && (
                <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Evolução dos Últimos 7 Dias</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={getWeekData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        tick={{ fill: '#4b5563', fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fill: '#4b5563', fontSize: 12 }}
                      />
                      <Tooltip 
                        labelFormatter={(date) => formatDate(date)}
                        formatter={(value) => [`${value.toFixed(1).replace('.', ',')}%`, 'Média']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="averagePercentage" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        dot={{ fill: '#6366f1', r: 5 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={() => 90} 
                        stroke="#10b981" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                        name="Meta 90%"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Lista de Dias Registrados */}
              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gray-100 px-6 py-3 border-b-2 border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Histórico de Dias Trabalhados</h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {history.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      Nenhum dia registrado ainda. Salve o primeiro dia para começar o histórico!
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Média</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tempo Médio</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Meta</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Detalhes</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {history.map((day) => (
                          <tr key={day.date} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-800">
                              {formatDate(day.date)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-lg font-bold ${
                                day.averagePercentage >= 90 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {day.averagePercentage.toFixed(1).replace('.', ',')}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-gray-700 font-semibold">
                              {day.averageTime}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {day.averagePercentage >= 90 ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ Atingida</span>
                              ) : (
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">✗ Faltou {(90 - day.averagePercentage).toFixed(1)}%</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <details className="inline-block">
                                <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-semibold text-xs">
                                  👥 Ver Equipe
                                </summary>
                                <div className="absolute bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4 mt-2 z-20 min-w-[300px]">
                                  {day.employees.map((emp, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                      <span className="font-medium text-gray-700">{emp.name}</span>
                                      <div className="text-right">
                                        <div className={`font-bold ${emp.percentage >= 90 ? 'text-green-600' : 'text-red-600'}`}>
                                          {emp.percentage.toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-500">{emp.hours} / {emp.dailyGoal}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => loadHistoricalDay(day.date)}
                                  className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 text-xs font-semibold"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => deleteDay(day.date)}
                                  className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-xs font-semibold"
                                >
                                  🗑️ Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {selectedDate && (
                <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                  <p className="text-sm text-indigo-800">
                    <strong>📅 Dica:</strong> Clique em "✏️ Editar" em qualquer dia do histórico para carregar seus dados e poder modificá-los. 
                    Use o seletor de data para adicionar apontamentos de dias anteriores.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}