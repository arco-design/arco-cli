# Run this shell like
# build.sh dev esm, build files to ESM with dev mode
# build.sh esm, build files to ESM

root=`git rev-parse --show-toplevel`
babel_config_path="${root}/babel.config.js"

babel_options=""

if [[ $1 == dev ]]; then
  babel_options="--watch --source-maps"
fi

if [[ $1 != esm && $2 != esm ]]; then
  babel_options="${babel_options} --plugins=@babel/plugin-transform-modules-commonjs"
fi

#tsc --emitDeclarationOnly --paths "null"

# Compile .ts with babel and copy tsc un-support files
babel src -d dist -x ".ts,.tsx,.js" --copy-files --verbose --config-file $babel_config_path $babel_options
