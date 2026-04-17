"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Scissors,
  Plus,
  Users,
  Calendar,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
  Pencil,
  Trash2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/app/lib/client/api";

const BUSINESS_COLOR = "#7c3aed";
const PAGE_BG = "#0c0812";

type Service = {
  id: string;
  name: string;
  price: string;
  durationMinutes: number;
  description: string | null;
  isActive: boolean;
};

type ServiceFormData = {
  name: string;
  price: string;
  durationMinutes: string;
  description: string;
};

const DEFAULT_FORM: ServiceFormData = {
  name: "",
  price: "",
  durationMinutes: "30",
  description: "",
};

function Sidebar({ activeHref }: { activeHref: string }) {
  const navItems = [
    { icon: <Calendar className="h-4 w-4" />, label: "Расписание", href: "/cabinet/business" },
    { icon: <Users className="h-4 w-4" />, label: "Сотрудники", href: "/cabinet/business/employees" },
    { icon: <Users className="h-4 w-4" />, label: "Клиенты", href: "/cabinet/business/clients" },
    { icon: <BarChart3 className="h-4 w-4" />, label: "Аналитика", href: "/cabinet/business/analytics" },
    { icon: <DollarSign className="h-4 w-4" />, label: "Финансы", href: "/cabinet/business/finances" },
    { icon: <Settings className="h-4 w-4" />, label: "Услуги", href: "/cabinet/business/services" },
  ];

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col text-white"
      style={{ backgroundColor: BUSINESS_COLOR }}
    >
      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2">
        <Scissors className="h-5 w-5" />
        <span className="font-bold text-base">BookApp</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeHref === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: isActive ? "rgba(255,255,255,0.15)" : undefined,
                borderLeft: isActive ? "3px solid #f0a000" : "3px solid transparent",
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/10 rounded-lg w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  );
}

function ServiceFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => void;
  initialData: ServiceFormData;
  isLoading: boolean;
  title: string;
}) {
  const [form, setForm] = useState<ServiceFormData>(initialData);

  // Reset form when opened with new data
  const handleOpen = () => setForm(initialData);

  function handleChange(field: keyof ServiceFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.durationMinutes) return;
    onSubmit(form);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        else handleOpen();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Название *</label>
            <Input
              placeholder="Стрижка, Маникюр..."
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Цена (₽) *</label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="1500"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Длительность (мин) *</label>
              <Input
                type="number"
                min="15"
                step="15"
                placeholder="30"
                value={form.durationMinutes}
                onChange={(e) => handleChange("durationMinutes", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Описание</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              placeholder="Необязательное описание услуги..."
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: BUSINESS_COLOR }}
            >
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ServicesPage() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await api.services.get();
      return (res.data ?? []) as unknown as Service[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (form: ServiceFormData) => {
      await api.services.post({
        name: form.name,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        description: form.description || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Услуга добавлена");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setIsAddOpen(false);
    },
    onError: () => {
      toast.error("Не удалось добавить услугу");
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: ServiceFormData }) => {
      await api.services({ id }).patch({
        name: form.name,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        description: form.description || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Услуга обновлена");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setEditService(null);
    },
    onError: () => {
      toast.error("Не удалось обновить услугу");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.services({ id }).delete();
    },
    onSuccess: () => {
      toast.success("Услуга деактивирована");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => {
      toast.error("Не удалось удалить услугу");
    },
  });

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: PAGE_BG }}>
      <Sidebar activeHref={pathname} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 bg-card border-b">
          <h1 className="font-bold text-lg flex-1">Услуги</h1>
          <Button
            className="gap-2"
            style={{ backgroundColor: BUSINESS_COLOR }}
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Добавить услугу
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-4 border h-20 animate-pulse" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
              <Settings className="h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">Нет услуг</p>
              <Button
                style={{ backgroundColor: BUSINESS_COLOR }}
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить первую услугу
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="divide-y divide-border">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-secondary transition-colors"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{service.name}</p>
                        {!service.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Неактивна
                          </Badge>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {service.durationMinutes} мин
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-base" style={{ color: BUSINESS_COLOR }}>
                        {Number(service.price).toLocaleString("ru-RU")} ₽
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditService(service)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Удалить услугу "${service.name}"?`)) {
                            deleteMutation.mutate(service.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add dialog */}
      <ServiceFormDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={(form) => addMutation.mutate(form)}
        initialData={DEFAULT_FORM}
        isLoading={addMutation.isPending}
        title="Добавить услугу"
      />

      {/* Edit dialog */}
      {editService && (
        <ServiceFormDialog
          open={true}
          onClose={() => setEditService(null)}
          onSubmit={(form) => editMutation.mutate({ id: editService.id, form })}
          initialData={{
            name: editService.name,
            price: editService.price,
            durationMinutes: String(editService.durationMinutes),
            description: editService.description ?? "",
          }}
          isLoading={editMutation.isPending}
          title="Редактировать услугу"
        />
      )}
    </div>
  );
}
