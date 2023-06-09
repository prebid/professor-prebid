import { useState, useEffect } from 'react'

export const useDebounce = (value: any, milliSeconds: number) => {
 const [debouncedValue, setDebouncedValue] = useState(value);

 useEffect(() => {
   const handler = setTimeout(() => {
     setDebouncedValue(value);
   }, milliSeconds);

   return () => {
     clearTimeout(handler);
   };
 }, [value, milliSeconds]);

 return debouncedValue;
};

interface UseDebounceProps {
  value: any;
  milliSeconds: number;
}
