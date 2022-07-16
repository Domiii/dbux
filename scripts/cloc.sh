set -e
set -x

perl node_modules/cloc/lib/cloc --match-f='.*\.(js|py)$' --fullpath --match-d='(dbux-[^/]+|analysis|samples/(__samplesInput__|case-studies))' --not-match-d='(dbux_projects|node_modules|dist|project_sandbox)$' --not-match-f='.*\.inst\..*|.*\.dbux\..*|javascript[-]algorithms[-]all\.js'  --by-file .
