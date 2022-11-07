root=`git rev-parse --show-toplevel`
babel_config_path="${root}/babel.config.js"

tsc_option=""
babel_options=""

if [[ $1 == dev ]]; then
  tsc_option="-w"
  babel_options="--watch --source-maps"
fi

# Generate .d.ts for dist files
# Compile .ts with babel and copy tsc un-support files
babel src -d dist -x ".ts,.tsx,.js" --copy-files --verbose --config-file $babel_config_path $babel_options & tsc --emitDeclarationOnly $tsc_option
