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
  { label: 'Fish', value: 'Fish', emoji: '🐟', ruLabel: 'Рыбка' },
  { label: 'Hamster', value: 'Hamster', emoji: '🐹', ruLabel: 'Хомяк' },
  { label: 'Rabbit', value: 'Rabbit', emoji: '🐰', ruLabel: 'Кролик' },
  { label: 'Reptile', value: 'Reptile', emoji: '🦎', ruLabel: 'Рептилия' },
  { label: 'Horse', value: 'Horse', emoji: '🐴', ruLabel: 'Лошадь' },
  { label: 'Parrot', value: 'Parrot', emoji: '🦜', ruLabel: 'Попугай' },
  { label: 'Other', value: 'Other', emoji: '🐾', ruLabel: 'Другое' },
];

export const getSpeciesIcon = (species: string): string => {
  if (!species) return '🐾';
  
  const lowerSpecies = species.toLowerCase();
  
  // Проверяем точные совпадения
  if (lowerSpecies === 'dog' || lowerSpecies === 'собака') return '🐕';
  if (lowerSpecies === 'cat' || lowerSpecies === 'кошка' || lowerSpecies === 'кот') return '🐱';
  if (lowerSpecies === 'bird' || lowerSpecies === 'птица') return '🐦';
  if (lowerSpecies === 'fish' || lowerSpecies === 'рыбка' || lowerSpecies === 'рыба') return '🐟';
  if (lowerSpecies === 'hamster' || lowerSpecies === 'хомяк') return '🐹';
  if (lowerSpecies === 'rabbit' || lowerSpecies === 'кролик') return '🐰';
  if (lowerSpecies === 'reptile' || lowerSpecies === 'рептилия') return '🦎';
  if (lowerSpecies === 'horse' || lowerSpecies === 'лошадь') return '🐴';
  if (lowerSpecies === 'parrot' || lowerSpecies === 'попугай') return '🦜';
  
  // Проверяем частичные совпадения
  if (lowerSpecies.includes('dog') || lowerSpecies.includes('собака')) return '🐕';
  if (lowerSpecies.includes('cat') || lowerSpecies.includes('кошка') || lowerSpecies.includes('кот')) return '🐱';
  if (lowerSpecies.includes('bird') || lowerSpecies.includes('птица')) return '🐦';
  if (lowerSpecies.includes('fish') || lowerSpecies.includes('рыбка') || lowerSpecies.includes('рыба')) return '🐟';
  if (lowerSpecies.includes('hamster') || lowerSpecies.includes('хомяк')) return '🐹';
  if (lowerSpecies.includes('rabbit') || lowerSpecies.includes('кролик')) return '🐰';
  if (lowerSpecies.includes('reptile') || lowerSpecies.includes('рептилия')) return '🦎';
  if (lowerSpecies.includes('horse') || lowerSpecies.includes('лошадь')) return '🐴';
  if (lowerSpecies.includes('parrot') || lowerSpecies.includes('попугай')) return '🦜';
  
  return '🐾';
};

export const getLocalizedSpeciesName = (species: string, language: string): string => {
  if (!species) return '';
  
  const lowerSpecies = species.toLowerCase();
  
  // Проверяем точные совпадения
  if (lowerSpecies === 'dog') return language === 'ru-RU' ? 'Собака' : 'Dog';
  if (lowerSpecies === 'cat') return language === 'ru-RU' ? 'Кошка' : 'Cat';
  if (lowerSpecies === 'bird') return language === 'ru-RU' ? 'Птица' : 'Bird';
  if (lowerSpecies === 'fish') return language === 'ru-RU' ? 'Рыбка' : 'Fish';
  if (lowerSpecies === 'hamster') return language === 'ru-RU' ? 'Хомяк' : 'Hamster';
  if (lowerSpecies === 'rabbit') return language === 'ru-RU' ? 'Кролик' : 'Rabbit';
  if (lowerSpecies === 'reptile') return language === 'ru-RU' ? 'Рептилия' : 'Reptile';
  if (lowerSpecies === 'horse') return language === 'ru-RU' ? 'Лошадь' : 'Horse';
  if (lowerSpecies === 'parrot') return language === 'ru-RU' ? 'Попугай' : 'Parrot';
  
  // Проверяем русские названия
  if (lowerSpecies === 'собака') return language === 'ru-RU' ? 'Собака' : 'Dog';
  if (lowerSpecies === 'кошка' || lowerSpecies === 'кот') return language === 'ru-RU' ? 'Кошка' : 'Cat';
  if (lowerSpecies === 'птица') return language === 'ru-RU' ? 'Птица' : 'Bird';
  if (lowerSpecies === 'рыбка' || lowerSpecies === 'рыба') return language === 'ru-RU' ? 'Рыбка' : 'Fish';
  if (lowerSpecies === 'хомяк') return language === 'ru-RU' ? 'Хомяк' : 'Hamster';
  if (lowerSpecies === 'кролик') return language === 'ru-RU' ? 'Кролик' : 'Rabbit';
  if (lowerSpecies === 'рептилия') return language === 'ru-RU' ? 'Рептилия' : 'Reptile';
  if (lowerSpecies === 'лошадь') return language === 'ru-RU' ? 'Лошадь' : 'Horse';
  if (lowerSpecies === 'попугай') return language === 'ru-RU' ? 'Попугай' : 'Parrot';
  
  // Если не найдено точное совпадение, возвращаем оригинальное название
  return species;
};

// Хук для использования в компонентах
export const useSpeciesUtils = () => {
  const { t, i18n } = useTranslation();
  
  const getSpeciesDisplayName = (species: string): string => {
    if (!species) return '';
    
    // Сначала пытаемся найти перевод в файлах переводов
    const speciesKey = species.toLowerCase();
    const translationKey = `pets.species.${speciesKey}`;
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