import json
import os
from tkinter import *
from tkinter import messagebox

root = Tk()
root.title("Управление шаблонами")
root.geometry("300x150")

TEMPLATE_FILE = "responseTemplates.json"

# Создание файла, если он отсутствует
if not os.path.exists(TEMPLATE_FILE):
    with open(TEMPLATE_FILE, "w") as f:
        json.dump([], f)  # Пустой список

def load_templates():
    """ Загружает шаблоны из JSON-файла. """
    try:
        with open(TEMPLATE_FILE, "r") as file:
            return json.load(file)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def save_templates(templates):
    """ Сохраняет обновленный список шаблонов в JSON. """
    with open(TEMPLATE_FILE, "w") as file:
        json.dump(templates, file, indent=4, ensure_ascii=False)

def add_template():
    """ Окно для добавления нового шаблона. """
    win = Toplevel(root)
    win.geometry("500x500")
    win.title("Добавить шаблон")

    Label(win, text="Введите название шаблона").pack()
    ent_name = Entry(win, width=50)
    ent_name.pack()

    Label(win, text="Введите описание шаблона").pack()
    ent_desc = Entry(win, width=50)
    ent_desc.pack()

    Label(win, text="Введите текст шаблона").pack()
    ent_text = Text(win, width=50, height=5)
    ent_text.pack()

    def save_template():
        name = ent_name.get().strip()
        description = ent_desc.get().strip()
        text = ent_text.get("1.0", END).strip()

        if not name or not description or not text:
            messagebox.showwarning("Ошибка", "Все поля должны быть заполнены!")
            return

        templates = load_templates()
        templates.append({"name": name, "description": description, "text": text})
        save_templates(templates)

        messagebox.showinfo("Успех", f"Шаблон '{name}' добавлен!")
        win.destroy()

    Button(win, text="Сохранить", command=save_template).pack()

def remove_template():
    """ Окно для удаления шаблонов. """
    win = Toplevel(root)
    win.geometry("500x400")
    win.title("Удалить шаблон")

    Label(win, text="Выберите шаблон для удаления:").pack()

    listbox = Listbox(win, width=50, height=15)
    listbox.pack()

    templates = load_templates()
    
    if not templates:
        listbox.insert(END, "Нет доступных шаблонов")
        listbox.config(state=DISABLED)  # Блокируем, если пусто
    else:
        for tpl in templates:
            listbox.insert(END, tpl["name"])

    def delete_selected():
        selected_index = listbox.curselection()
        if not selected_index:
            messagebox.showwarning("Ошибка", "Выберите шаблон для удаления!")
            return

        index = selected_index[0]
        template_name = templates[index]["name"]

        if messagebox.askyesno("Подтверждение", f"Удалить шаблон '{template_name}'?"):
            del templates[index]
            save_templates(templates)

            messagebox.showinfo("Успех", f"Шаблон '{template_name}' удален!")
            win.destroy()

    Button(win, text="Удалить", command=delete_selected).pack()

button_add = Button(root, text="Добавить шаблон", command=add_template)
button_add.pack()

button_remove = Button(root, text="Удалить шаблон", command=remove_template)
button_remove.pack()

root.mainloop()
