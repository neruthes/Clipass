# Clipass

CLI password management.

## Installation

```
$ npm install -g clipass
```

## Usages

The standard command entry is `clipass`. Alias `pas` is available.

### Set Password

```
$ clipass set github.neruthes 123456
$ clipass s github.neruthes 123456
```

### Copy Password

```
$ clipass copy github.neruthes
$ clipass c github.neruthes
```

### Delete Password

```
$ clipass rm github.neruthes
```

### List Password Entries

```
$ clipass ls
```

### Other Usages

See [GitHub Wiki](https://github.com/neruthes/Clipass/wiki/Clipass-User-Manual).

## Data Management

See directory: `~/.xyz.neruthes.clipass.v1`.

You may sync data via Git.

## Copyright

Copyright (C) 2019-2020 Neruthes <[neruthes.xyz](https://neruthes.xyz)> <[0x5200DF38](https://pgp.to/#0xCB0ABC7756440D12915E3F25AFB3373F5200DF38)>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.
