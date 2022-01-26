# Template Processor 1.0
Process templates to generate files. 

## Description
Replace any pattern from Template File with values from a Data File to create hydarated files.

## Parameter Description
1. `SAMPLE_TEMPLATE` is the file path where template is located. 
    
    It should be a *UTF-8* encoded text file.
2. `DATA_FILE` 
    
    Must be a csv file from where data rows are processed. This file would contain rows of data to hydrate the template with. Each row would correspond to one hydrated file. 
3. `IGNORE_HEADER` 
    
    flag (`-i` or `--ignore-header`) can be used to ignore header row present in `DATA_FILE`.

4. `TEMAPLATE_VARS`
    
    is a list of variables in a *comma-separated-text* format. Columns in `DATA_FILE` are mapped to `TEMAPLATE_VARS` list in the same order.
    
    If a filepath is provided, the list is read from the file.

5. `REPLACE_PATTERN`
    
    is the pattern in which variables are present in the `SAMPLE_TEMPLATE`. Default assumed is `@variable`. Where variable can be anyone from the `TEMPLATE_VARS` list.
    
    Any and all occurences of the variable patterns would be replaced with the actual value taken from the `DATA_FILE`.
    
    If filepath is provided, the pattern is read from the file.

6. `OUTPUT_DIR` 
    
    is the directory where hydrated files would be generated. Defaults to `./output` sub directory created automatically within the present working directory.
    
    `OUT_FILENAME_PATTERN` is the pattern to name to hydrated files with. This can use the variables from `TEMPLATE_VARS` by prefixing them with `@`. For example `@serial.txt` as
    `OUT_FILENAME_PATTERN` would create `.txt` files with name taken from `DATA_FILE` corresponding to column asociated with variable name `serial`.
    
    If filepath is provided, the pattern is read from the file.

7. `FIELD_MODIFIER`
    
    is used to replace the values from `DATA_FILE` with another value before using it to hydrate the `SAMPLE_TEMPLATE`. This is particularly useful if `,` is to be present
    in the any column of the `DATA_FILE`. 
    
    For instance if a value is like `220V, 1A, 50Hz` we can replace it with `220V; 1A; 50Hz` and add FIELD_MODIFIER as `{";" : ","}` which will replace the `;` with `,` before hydrating.
    
    If filepath is provided, the pattern is read from the file.

## Example
```
sample.txt
          Hello @name,

          Happy New year. Wishing you lots of happiness in the coming year.

          Your @relation,
          John Doe
```
```
data.csv
          Ajay,        brother
          Seema,       sister
```

**Running command:**
`node index.js -s ./sample.txt -d ./data.csv -v name,relation -p @name.txt -o ./letters` would generate two letter files `Ajay.txt` and `Seema.txt` in directory `letters`