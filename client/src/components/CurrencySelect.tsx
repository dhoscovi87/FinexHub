import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  excludeCurrency?: string;
}

export function CurrencySelect({ value, onValueChange, excludeCurrency }: CurrencySelectProps) {
  const currencies = [
    { value: "HBAR", label: "HBAR (ℏ)" },
    { value: "USDC", label: "USDC ($)" },
    { value: "CFA", label: "CFA Francs" },
  ].filter(currency => currency.value !== excludeCurrency);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map(currency => (
          <SelectItem key={currency.value} value={currency.value}>
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
