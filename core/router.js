export class Router {
    constructor(routes) {
      this.routes = routes;
      window.addEventListener('popstate', this.handleRoute.bind(this));
    }
  
    handleRoute() {
      const path = window.location.pathname;
      const route = this.routes[path];
      if (route) {
        route();
      }
    }
  
    navigate(path) {
      window.history.pushState({}, '', path);
      this.handleRoute();
    }
  }
  