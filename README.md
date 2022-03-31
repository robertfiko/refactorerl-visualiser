# RefactorErl visualiser

RefactorErl visualiser is a Visual Studio Code plugin, which works well with Erlang LS and RefactorErl. 

(**Ref**actor Erl and **E**rlang **LS** ~ refels)

## Prerequisites
- GNU make
- VSCE: `npm install -g vsce`
- The `code` command: 
	- Mac OS: https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line 
	- Windows: (tip section) https://code.visualstudio.com/docs/setup/windows#_installation

## Install: Erlang LS with RefactorErl interface code

1. Clone the repository
2. `make refels` _(this will create a `.vsix` file, and install it)_

_Note:_ if you just want to package (create) the `.vsix` file use `make compile-refels`

## Install: RefactorErl visualiser
1. Clone the repository (if you haven't already)
2. `make visualiser` 
### Uninstall RefactorErl visualiser
 `code --uninstall-extension robert-fiko.refactorerl-visualizer --force`

 ## Install: RefactorErl 
 **WARNING! The current release is not containing the neccessary interface code!*
 
 Download RefactorErl from here and follow the neccessary installing actions. [https://plc.inf.elte.hu/erlang/refactorerl-releases.html](https://plc.inf.elte.hu/erlang/refactorerl-releases.html)

 ## Getting everything together

 ### Erlang LS config file
 
 ...

 ### RefactorErl

 You need to start RefactorErl....
