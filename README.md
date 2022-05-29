# RefactorErl visualiser

[![Lines Of Code](https://tokei.rs/b1/github/robertfiko/refactorerl-visualiser?category=code)](https://github.com/robertfiko/refactorerl-visualiser)

Telepíthető a `refactorerl-visualizer-0.0.1.vsix` állományból is.

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
 
 Your Erlang LS config file should contain these parts to work with RefactorErl and its visualiser
 
```
diagnostics:
  enabled:
    - refactorerl

refactorerl:
  node: "nodeName@hostName" 		
  diagnostics:
    - "unused_macros"			
    - "unsecure_os_call"

```

Under diagnostics you need to list the ones you would like to run.

 ### RefactorErl

 You need to start RefactorErl with `-sname`
