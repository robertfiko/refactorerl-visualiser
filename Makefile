compile-refels:
	git clone https://github.com/robertfiko/vscode
	mv vscode .vscode-els-referl
	npm install -g vsce
	cd .vscode-els-referl;\
		git submodule update --init;\
		rm -rf erlang_ls/_build;\
		rm -rf client/out;\
		npm install;\
		npm run compile;\
		vsce package --out erlang_ls_with_refactorerl.vsix

refels: compile-refels
	cd .vscode-els-referl;\
		code --install-extension erlang_ls_with_refactorerl.vsix --force

visualiser:
	vsce package --out refactorerl_visualiser.vsix
	code --install-extension refactorerl_visualiser.vsix --force

remove:
	code --uninstall-extension robert-fiko.refactorerl-visualizer --force
