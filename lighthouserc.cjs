const baseUrl = normalizeBaseUrl(process.env.npm_config_url || process.env.BASE_URL || "https://cup-margin.vercel.app");
const formFactor = process.env.LHCI_FORM_FACTOR || "mobile";
const isDesktop = formFactor === "desktop";
const outputDir = process.env.LHCI_OUTPUT_DIR || `.lighthouseci/${formFactor}`;
const chromeUserDataDir = process.env.LHCI_CHROME_USER_DATA_DIR;
const chromeFlags = ["--no-sandbox", chromeUserDataDir ? `--user-data-dir=${chromeUserDataDir}` : ""].filter(Boolean).join(" ");

const urls = [new URL("/", baseUrl).toString(), new URL("/calculator", baseUrl).toString()];

const commonAssertions = {
  "categories:accessibility": ["error", { minScore: 0.91 }],
  "categories:best-practices": ["error", { minScore: 1 }],
  "categories:seo": ["error", { minScore: 1 }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
};

const thresholds = isDesktop
  ? {
      landing: {
        "categories:performance": ["error", { minScore: 0.7 }],
        "first-contentful-paint": ["error", { maxNumericValue: 2016 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2814 }],
        "total-blocking-time": ["error", { maxNumericValue: 1241 }],
      },
      calculator: {
        "categories:performance": ["error", { minScore: 0.25 }],
        "first-contentful-paint": ["error", { maxNumericValue: 12111 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 13011 }],
        "total-blocking-time": ["error", { maxNumericValue: 1669 }],
      },
    }
  : {
      landing: {
        "categories:performance": ["error", { minScore: 0.45 }],
        "first-contentful-paint": ["error", { maxNumericValue: 12109 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 13009 }],
        "total-blocking-time": ["error", { maxNumericValue: 1273 }],
      },
      calculator: {
        "categories:performance": ["error", { minScore: 0.22 }],
        "first-contentful-paint": ["error", { maxNumericValue: 12173 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 13719 }],
        "total-blocking-time": ["error", { maxNumericValue: 3517 }],
      },
    };

module.exports = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 1,
      settings: isDesktop
        ? {
            preset: "desktop",
            chromeFlags,
          }
        : {
            chromeFlags,
          },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: "/$",
          assertions: {
            ...commonAssertions,
            ...thresholds.landing,
          },
        },
        {
          matchingUrlPattern: "/calculator/?$",
          assertions: {
            ...commonAssertions,
            ...thresholds.calculator,
          },
        },
      ],
    },
    upload: {
      target: "filesystem",
      outputDir,
    },
  },
};

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
