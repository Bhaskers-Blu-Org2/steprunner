function checkRC()
{
	local rc=$?; 
	if [[ $rc != 0 ]]; then 
		exit $rc; 
	fi
}

echo removing _build
rm -rf ../_build
checkRC

mkdir ../_build
checkRC

tsc *.ts --module commonjs --outDir ../_build
checkRC

node ../_build/test.js
checkRC
