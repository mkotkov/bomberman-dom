export function createElement(tag, attrs = {}) {
    const element = document.createElement(tag);
  
    // Validate the id attribute for valid characters
    if (attrs.id && !/^[a-zA-Z_][\w\-]*$/.test(attrs.id)) {
      console.error(`Invalid ID: ${attrs.id}`);
      delete attrs.id; // Remove invalid ID attribute
    }
  
    // Set the attributes
    Object.keys(attrs).forEach((key) => {
      if (key === 'style') {
        Object.keys(attrs.style).forEach((styleKey) => {
          element.style[styleKey] = attrs.style[styleKey];
        });
      } else {
        element.setAttribute(key, attrs[key]);
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
  