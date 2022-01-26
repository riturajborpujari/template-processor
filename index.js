const fs = require("fs");
const path = require("path");
const stream = require("stream");
const { parse } = require("csv-parse");
const { ArgumentParser, RawDescriptionHelpFormatter } = require("argparse");

class HelpFormatter extends RawDescriptionHelpFormatter {
  // executes parent _split_lines for each line of the help, then flattens the result
  _split_lines(text, width) {
    return [].concat(
      ...text.split("\n").map((line) => super._split_lines(line, width))
    );
  }
}
const description = `
Template Processor 1.0

Process templates to generate files. Replace any pattern from Template File with values from a Data File to create hydarated files.

SAMPLE_TEMPLATE is the file path where template is located. It should be a UTF-8 encoded text file.

DATA_FILE must be a csv file from where data rows are processed. This file would contain rows of data to hydrate the template with. Each row would correspond to one hydrated file. 
IGNORE_HEADER flag (-i or --ignore-header) can be used to ignore header row present in DATA_FILE.

TEMAPLATE_VARS is a list of variables in a comma-separated-text format. Columns in DATA_FILE are mapped to TEMAPLATE_VARS list in the same order.

If a filepath is provided, the list is read from the file.

REPLACE_PATTERN is the pattern in which variables are present in the SAMPLE_TEMPLATE. Default assumed is '@variable'. Where variable can be anyone from the TEMPLATE_VARS list.
Any and all occurences of the variable patterns would be replaced with the actual value taken from the DATA_FILE.

If filepath is provided, the pattern is read from the file.

OUTPUT_DIR is the directory where hydrated files would be generated. Defaults to 'output' sub directory created automatically within the present working directory.

OUT_FILENAME_PATTERN is the pattern to name to hydrated files with. This can use the variables from TEMPLATE_VARS by prefixing them with '@'. For example '@serial.txt' as
OUT_FILENAME_PATTERN would create '.txt' file with name taken from DATA_FILE corresponding to column asociated with variable name 'serial'.

If filepath is provided, the pattern is read from the file.

FIELD_MODIFIER is used to replace the values from DATA_FILE with another value before using it to hydrate the SAMPLE_TEMPLATE. This is particularly useful if ',' is to be present
in the any column of the DATA_FILE.
For instance if a value is like '220V, 1A, 50Hz' we can replace it with '220V; 1A; 50Hz' and add FIELD_MODIFIER as '{";" : ","}' which will replace the ';' with ',' before hydrating.

If filepath is provided, the pattern is read from the file.

Example:

sample.txt
          Hello @name,

          Happy New year. Wishing you lots of happiness in the coming year.

          Your @relation,
          John Doe

data.csv
          Person Name, Relation name
          Ajay,        brother
          Seema,       sister


Running command:
template-processor -s ./sample.txt -d ./data.csv -v name,relation -p @name.txt -o ./letters -i

would generate two letter files 'Ajay.txt' and 'Seema.txt' in directory 'letters'
`;

const parser = new ArgumentParser({
  prog: "template-processor",
  formatter_class: HelpFormatter,
  description,
  usage: `template-processor -s data/sample.txt -d data/sample.csv -v serial,code,mrp -p @serial-@code.txt -m '{";" : ","}' -o outputTemplates -r '@variable' -i`,
});

parser.add_argument("-s", "--sample-template", {
  dest: "SAMPLE_TEMPLATE",
  help: "Sample template file path.",
  required: true,
});
parser.add_argument("-d", "--data-file", {
  dest: "DATA_FILE",
  help: "Product file path. CSV file without headers",
  required: true,
});
parser.add_argument("-v", "--template-variables", {
  dest: "TEMPLATE_VARS",
  help: "Template Variable to map against Product file columns. If filepath is given, the list is read from the file",
  required: true,
});
parser.add_argument("-p", "--filename-pattern", {
  dest: "OUT_FILENAME_PATTERN",
  help: "Pattern used to name created files. Template vars can be used by prefixing them with '@'. If filepath is given, the pattern is read from the file",
  required: true,
});
parser.add_argument("-m", "--field-modifier", {
  dest: "FIELD_MODIFIER",
  help: `Replace Field value using any alphanumeric pattern with a constant value. It takes the form {"pattern": "value"}. If filepath is given, the modifier text is read from the file`,
  default: "{}",
});
parser.add_argument("-o", "--output-directory", {
  dest: "OUTPUT_DIR",
  help: "Directory where files should be created. Default './output'",
  default: "output",
});
parser.add_argument("-r", "--replace-pattern", {
  dest: "REPLACE_PATTERN",
  help: "The variable pattern to replace in the sample template. If filepath is given, the list is read from the file. Default '@variable'",
  default: "@variable",
});
parser.add_argument("-i", "--ignore-header", {
  dest: "IGNORE_HEADER",
  help: "Ignore header row present in data file. Default false",
  default: false,
  action: "store_true",
});

const args = parser.parse_args();

const DATA_FILE = args.DATA_FILE;
const SAMPLE_TEMPLATE = args.SAMPLE_TEMPLATE;
const OUTPUT_DIR = args.OUTPUT_DIR;
let OUT_FILENAME_PATTERN = args.OUT_FILENAME_PATTERN;
let FIELD_MODIFIER = args.FIELD_MODIFIER;
let TEMPLATE_VARS = args.TEMPLATE_VARS;
let REPLACE_PATTERN = args.REPLACE_PATTERN;
let IGNORE_HEADER = args.IGNORE_HEADER;

if (!fs.existsSync(SAMPLE_TEMPLATE)) {
  console.log(`[Error]: Sample template file ${SAMPLE_TEMPLATE} doesn't exist`);
  process.exit(1);
}
if (!fs.existsSync(DATA_FILE)) {
  console.log(`[Error]: Sample template file ${SAMPLE_TEMPLATE} doesn't exist`);
  process.exit(1);
}

if (fs.existsSync(TEMPLATE_VARS)) {
  TEMPLATE_VARS = fs
    .readFileSync(TEMPLATE_VARS, { encoding: "utf-8" })
}
TEMPLATE_VARS = TEMPLATE_VARS.split(",");

if (fs.existsSync(OUT_FILENAME_PATTERN)) {
  OUT_FILENAME_PATTERN = fs.readFileSync(OUT_FILENAME_PATTERN, {
    encoding: "utf-8",
  });
}
if (fs.existsSync(FIELD_MODIFIER)) {
  FIELD_MODIFIER = fs.readFileSync(FIELD_MODIFIER, { encoding: "utf-8" });
}
FIELD_MODIFIER = JSON.parse(FIELD_MODIFIER);
if (fs.existsSync(REPLACE_PATTERN)) {
  REPLACE_PATTERN = fs.readFileSync(REPLACE_PATTERN, { encoding: "utf-8" });
}
if (REPLACE_PATTERN.indexOf("variable") === -1) {
  console.log(
    `[Error]: Replace Pattern must contaion the text 'variable'. '${REPLACE_PATTERN}' is invalid`
  );
  process.exit(1);
}

console.log(`[Info]: Sample Template      : ${SAMPLE_TEMPLATE}`);
console.log(`[Info]: Data file            : ${DATA_FILE}`);
console.log(`[Info]: Ignoring header      : ${IGNORE_HEADER}`);
console.log(`[Info]: Template vars        : ${TEMPLATE_VARS.join(",")}`);
console.log(`[Info]: Out dir              : ${OUTPUT_DIR}`);
console.log(`[Info]: Out filename pattern : ${OUT_FILENAME_PATTERN}`);
console.log(
  `[Info]: Field modifiers      : ${Object.entries(FIELD_MODIFIER)
    .map((entry) => entry.join(" with "))
    .join(" AND ")}`
);
console.log(`[Info]: Replace pattern      : ${REPLACE_PATTERN}`);
console.log("\n");
ensureDir(OUTPUT_DIR);

const sampleTemplate = fs.readFileSync(SAMPLE_TEMPLATE, { encoding: "utf-8" });

const recordTransformer = new stream.Transform({
  objectMode: true,
  transform(record, _, cb) {
    let obj = {};

    TEMPLATE_VARS.forEach((variable, i) => {
      if (record[i] === undefined) {
        throw new Error(
          `[Error]: No column for Template variable '${variable}'`
        );
      }
      obj[variable] = fieldValModifier(record[i]);
    });

    cb(null, obj);
  },
});

let headerProcessed = false;
const templateHydrator = new stream.Writable({
  objectMode: true,
  write(record, _, cb) {
    if (!headerProcessed && IGNORE_HEADER) {
      headerProcessed = true;
      return cb(null);
    }
    const hydratedFile = HydrateTemplate(sampleTemplate, TEMPLATE_VARS, record);

    const templateName = createOutFileName(OUT_FILENAME_PATTERN, record);
    const templatePath = path.join(OUTPUT_DIR, templateName);
    fs.writeFileSync(templatePath, hydratedFile);

    console.log(`[Success]: ${templatePath}`);

    cb(null);
  },
});

fs.createReadStream(DATA_FILE)
  .pipe(parse())
  .pipe(recordTransformer)
  .pipe(templateHydrator);

/**
 * Modify any value based on column name
 */
const fieldValModifier = (val) => {
  val = Object.keys(FIELD_MODIFIER).reduce((value, pattern) => {
    return value.replace(new RegExp(pattern, "g"), FIELD_MODIFIER[pattern]);
  }, val);

  return val;
};

/**
 * Hydrate a template with variable values
 * @param {string} template the template file
 * @param {{[key in VARIABLES]: string}} values
 * @returns
 */
function HydrateTemplate(template, templateVars, values) {
  const hydrated = templateVars.reduce((template, variable) => {
    const variableReplacePattern = REPLACE_PATTERN.replace(
      "variable",
      variable
    );
    const rx = new RegExp(variableReplacePattern, "g");

    return template.replace(rx, values[variable]);
  }, template);

  return hydrated;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function createOutFileName(pattern, record) {
  return TEMPLATE_VARS.reduce((filename, variable) => {
    return filename.replace(`@${variable}`, record[variable]);
  }, pattern);
}
