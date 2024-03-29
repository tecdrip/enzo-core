import { MiddlewareHandler } from "hono";
import { FunctionComponent, createElement } from "preact";
import { renderComponent } from "../index";

const router = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: "./src/pages",
  origin: "http://localhost:3000",
  assetPrefix: "_next/static/",
});

let pageCache: Record<string, any> = {};

type PageComponent = {
  loader?: <T>() => Promise<T>;
  template: FunctionComponent;
};

async function importPageComponent(filePath: string): Promise<PageComponent> {
  if (pageCache[filePath]) {
    return pageCache[filePath];
  }

  const componentName = filePath.split("/").pop()?.split(".")[0];
  if (!componentName) {
    throw new Error("No component name found in file path");
  }

  const page = await import(filePath);

  let template;
  let loaderFunc = undefined;
  let hasDefaultExport = false;

  for (const exportName in page) {
    if (exportName == "default") {
      hasDefaultExport = true;
    }

    if (page.hasOwnProperty(exportName) && exportName == "loader") {
      loaderFunc = page[exportName];
      continue;
    }

    if (
      page.hasOwnProperty(exportName) &&
      exportName.toLowerCase() == componentName?.toLowerCase()
    ) {
      template = page[exportName];
      continue;
    }
  }

  if (!template && !hasDefaultExport) {
    throw new Error(
      `export named ${componentName} not found in ${filePath}. No default export found either`
    );
  }

  if (!template) {
    template = page.default;
  }

  return {
    loader: loaderFunc,
    template: template,
  };
}

export const fileRouter = (): MiddlewareHandler => {
  return async (c, next) => {
    if (c.req.method === "POST") {
      return next();
    }

    const routeMatch = router.match(c.req.path);

    // @ts-ignore
    c.req.param = function (key: string) {
      return routeMatch?.params[key];
    };

    if (routeMatch) {
      const pageComponent = await importPageComponent(routeMatch.filePath);
      const element = createElement(pageComponent.template, {});
      return renderComponent(c, element, pageComponent.loader);
    }

    return next();
  };
};
