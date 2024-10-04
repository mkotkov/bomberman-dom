export function on(element, eventType, handler) {
    // Убедимся, что элемент поддерживает установку свойства для события
    if (typeof element[eventType] !== 'undefined') {
        element[eventType] = handler;
    } else {
        // Если событие не поддерживается напрямую через свойство
        const eventHandlerKey = `on${eventType}`;
        element[eventHandlerKey] = handler;
    }
}
