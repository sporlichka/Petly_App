import { useTranslation } from 'react-i18next';

export interface SpeciesInfo {
  value: string;
  label: string;
  emoji: string;
  ruLabel: string;
}

export const SPECIES_LIST: SpeciesInfo[] = [
  { label: 'Dog', value: 'Dog', emoji: '🐕', ruLabel: 'Собака' },
  { label: 'Cat', value: 'Cat', emoji: '🐱', ruLabel: 'Кошка' },
  { label: 'Bird', value: 'Bird', emoji: '🐦', ruLabel: 'Птица' },
  { label: 'Fish', value: 'Fish', emoji: '🐟', ruLabel: 'Рыба' },
  { label: 'Hamster', value: 'Hamster', emoji: '🐹', ruLabel: 'Хомяк' },
  { label: 'Rabbit', value: 'Rabbit', emoji: '🐰', ruLabel: 'Кролик' },
  { label: 'Turtle', value: 'Turtle', emoji: '🐢', ruLabel: 'Черепаха' },
  { label: 'Snake', value: 'Snake', emoji: '🐍', ruLabel: 'Змея' },
  { label: 'Lizard', value: 'Lizard', emoji: '🦎', ruLabel: 'Ящерица' },
  { label: 'Other', value: 'Other', emoji: '🐾', ruLabel: 'Другое' },
];

export const getSpeciesIcon = (species: string): string => {
  if (!species) return '🐾';
  
  const lowerSpecies = species.toLowerCase();
  
  // Проверяем точные совпадения
  if (lowerSpecies === 'dog' || lowerSpecies === 'собака') return '🐕';
  if (lowerSpecies === 'cat' || lowerSpecies === 'кошка' || lowerSpecies === 'кот') return '🐱';
  if (lowerSpecies === 'bird' || lowerSpecies === 'птица') return '🐦';
  if (lowerSpecies === 'fish' || lowerSpecies === 'рыба') return '🐟';
  if (lowerSpecies === 'hamster' || lowerSpecies === 'хомяк') return '🐹';
  if (lowerSpecies === 'rabbit' || lowerSpecies === 'кролик') return '🐰';
  if (lowerSpecies === 'guinea pig' || lowerSpecies === 'морская свинка') return '🐹';
  if (lowerSpecies === 'ferret' || lowerSpecies === 'хорек') return '🦡';
  if (lowerSpecies === 'turtle' || lowerSpecies === 'черепаха') return '🐢';
  if (lowerSpecies === 'snake' || lowerSpecies === 'змея') return '🐍';
  if (lowerSpecies === 'lizard' || lowerSpecies === 'ящерица') return '🦎';
  if (lowerSpecies === 'horse' || lowerSpecies === 'лошадь') return '🐴';
  
  // Проверяем частичные совпадения
  if (lowerSpecies.includes('dog') || lowerSpecies.includes('собака')) return '🐕';
  if (lowerSpecies.includes('cat') || lowerSpecies.includes('кошка') || lowerSpecies.includes('кот')) return '🐱';
  if (lowerSpecies.includes('bird') || lowerSpecies.includes('птица')) return '🐦';
  if (lowerSpecies.includes('fish') || lowerSpecies.includes('рыба')) return '🐟';
  if (lowerSpecies.includes('hamster') || lowerSpecies.includes('хомяк')) return '🐹';
  if (lowerSpecies.includes('rabbit') || lowerSpecies.includes('кролик')) return '🐰';
  if (lowerSpecies.includes('guinea') || lowerSpecies.includes('морская свинка')) return '🐹';
  if (lowerSpecies.includes('ferret') || lowerSpecies.includes('хорек')) return '🦡';
  if (lowerSpecies.includes('turtle') || lowerSpecies.includes('черепаха')) return '🐢';
  if (lowerSpecies.includes('snake') || lowerSpecies.includes('змея')) return '🐍';
  if (lowerSpecies.includes('lizard') || lowerSpecies.includes('ящерица')) return '🦎';
  if (lowerSpecies.includes('horse') || lowerSpecies.includes('лошадь')) return '🐴';
  
  return '🐾';
};

export const getLocalizedSpeciesName = (species: string, language: string): string => {
  if (!species) return '';
  
  const lowerSpecies = species.toLowerCase();
  
  // Проверяем точные совпадения
  if (lowerSpecies === 'dog') return language === 'ru-RU' ? 'Собака' : 'Dog';
  if (lowerSpecies === 'cat') return language === 'ru-RU' ? 'Кошка' : 'Cat';
  if (lowerSpecies === 'bird') return language === 'ru-RU' ? 'Птица' : 'Bird';
  if (lowerSpecies === 'fish') return language === 'ru-RU' ? 'Рыба' : 'Fish';
  if (lowerSpecies === 'hamster') return language === 'ru-RU' ? 'Хомяк' : 'Hamster';
  if (lowerSpecies === 'rabbit') return language === 'ru-RU' ? 'Кролик' : 'Rabbit';
  if (lowerSpecies === 'guinea pig') return language === 'ru-RU' ? 'Морская свинка' : 'Guinea Pig';
  if (lowerSpecies === 'ferret') return language === 'ru-RU' ? 'Хорек' : 'Ferret';
  if (lowerSpecies === 'turtle') return language === 'ru-RU' ? 'Черепаха' : 'Turtle';
  if (lowerSpecies === 'snake') return language === 'ru-RU' ? 'Змея' : 'Snake';
  if (lowerSpecies === 'lizard') return language === 'ru-RU' ? 'Ящерица' : 'Lizard';
  if (lowerSpecies === 'horse') return language === 'ru-RU' ? 'Лошадь' : 'Horse';
  if (lowerSpecies === 'other') return language === 'ru-RU' ? 'Другое' : 'Other';
  
  // Проверяем русские названия
  if (lowerSpecies === 'собака') return language === 'ru-RU' ? 'Собака' : 'Dog';
  if (lowerSpecies === 'кошка' || lowerSpecies === 'кот') return language === 'ru-RU' ? 'Кошка' : 'Cat';
  if (lowerSpecies === 'птица') return language === 'ru-RU' ? 'Птица' : 'Bird';
  if (lowerSpecies === 'рыба') return language === 'ru-RU' ? 'Рыба' : 'Fish';
  if (lowerSpecies === 'хомяк') return language === 'ru-RU' ? 'Хомяк' : 'Hamster';
  if (lowerSpecies === 'кролик') return language === 'ru-RU' ? 'Кролик' : 'Rabbit';
  if (lowerSpecies === 'морская свинка') return language === 'ru-RU' ? 'Морская свинка' : 'Guinea Pig';
  if (lowerSpecies === 'хорек') return language === 'ru-RU' ? 'Хорек' : 'Ferret';
  if (lowerSpecies === 'черепаха') return language === 'ru-RU' ? 'Черепаха' : 'Turtle';
  if (lowerSpecies === 'змея') return language === 'ru-RU' ? 'Змея' : 'Snake';
  if (lowerSpecies === 'ящерица') return language === 'ru-RU' ? 'Ящерица' : 'Lizard';
  if (lowerSpecies === 'лошадь') return language === 'ru-RU' ? 'Лошадь' : 'Horse';
  if (lowerSpecies === 'другое') return language === 'ru-RU' ? 'Другое' : 'Other';
  
  // Если не найдено точное совпадение, возвращаем оригинальное название
  return species;
};

// Хук для использования в компонентах
export const useSpeciesUtils = () => {
  const { t, i18n } = useTranslation();
  
  const getSpeciesDisplayName = (species: string): string => {
    if (!species) return '';
    
    // Сначала пытаемся найти перевод в файлах переводов
    const speciesKey = species.toLowerCase().replace(' ', '_');
    const translationKey = `species.${speciesKey}`;
    const translation = t(translationKey, { defaultValue: '' });
    
    if (translation && translation !== translationKey) {
      return translation;
    }
    
    // Если перевод не найден, используем утилиту
    return getLocalizedSpeciesName(species, i18n.language);
  };
  
  const getSpeciesIconForHook = (species: string): string => {
    return getSpeciesIcon(species);
  };
  
  return {
    getSpeciesDisplayName,
    getSpeciesIcon: getSpeciesIconForHook,
  };
}; 