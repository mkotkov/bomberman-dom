export function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
  
    // Устанавливаем атрибуты
    Object.keys(attrs).forEach((key) => {
      element.setAttribute(key, attrs[key]);
    });
  
    // Добавляем дочерние элементы
    children.forEach((child) => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
  
    return element;
  }

  export function renderElements(container, elements) {
    // Очищаем контейнер перед добавлением новых элементов
    container.innerHTML = '';

    // Проверяем, является ли elements массивом
    if (Array.isArray(elements)) {
        elements.forEach(element => {
            container.appendChild(element);
        });
    } else if (elements && typeof elements === 'object') {
        // Если передан объект, создаем его
        const parentElement = createElement(elements.tag, elements.attributes, elements.children);
        container.appendChild(parentElement);
    }
}
  