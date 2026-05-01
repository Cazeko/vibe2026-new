"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIVERSITY_SEEDS } from "@/lib/data/universities";
import type { UniversityName } from "@/types";

const score = z.coerce.number().min(0).max(100);

const schema = z.object({
  university: z.enum([
    "한양",
    "중앙",
    "성균관",
    "경희",
    "이화",
    "서강",
    "홍익",
    "동국",
    "건국",
    "숭실",
  ]),
  vocab: score,
  grammar: score,
  reading: score,
});

export type ScoreFormValues = z.infer<typeof schema>;

type ScoreFormProps = {
  defaultValues?: Partial<ScoreFormValues>;
  onChange: (values: ScoreFormValues | null) => void;
};

export function ScoreForm({ defaultValues, onChange }: ScoreFormProps) {
  const { register, watch, setValue } = useForm<ScoreFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      university: defaultValues?.university ?? "한양",
      vocab: defaultValues?.vocab ?? 0,
      grammar: defaultValues?.grammar ?? 0,
      reading: defaultValues?.reading ?? 0,
    },
  });

  const values = watch();

  if (
    values.university &&
    Number.isFinite(values.vocab) &&
    Number.isFinite(values.grammar) &&
    Number.isFinite(values.reading)
  ) {
    onChange(values);
  }

  return (
    <form className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="university">학교</Label>
        <Select
          value={values.university}
          onValueChange={(v) =>
            setValue("university", v as UniversityName, { shouldValidate: true })
          }
        >
          <SelectTrigger id="university" aria-label="학교 선택">
            <SelectValue placeholder="학교를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {UNIVERSITY_SEEDS.map((u) => (
              <SelectItem key={u.name} value={u.name}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ScoreField label="어휘" id="vocab" {...register("vocab")} />
        <ScoreField label="문법" id="grammar" {...register("grammar")} />
        <ScoreField label="독해" id="reading" {...register("reading")} />
      </div>
    </form>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
};

const ScoreField = ({ label, id, ...rest }: FieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input id={id} type="number" min={0} max={100} {...rest} />
  </div>
);
