root=`git rev-parse --show-toplevel`
babel_config_path="${root}/babel.config.js"

babel_options="--plugins=@babel/plugin-transform-modules-commonjs"

if [[ $1 == dev ]]; then
  babel_options="${babel_options} --watch"
fi

# Compile .ts with babel and copy tsc un-support files
babel src -d dist -x ".ts,.tsx,.js" --copy-files --verbose --source-maps --config-file $babel_config_path $babel_options
