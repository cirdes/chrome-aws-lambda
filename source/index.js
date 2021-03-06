const fs = require('fs');
const path = require('path');

class Chromium {
  /**
   * Returns a list of recommended additional Chromium flags.
   *
   * @returns {!Array<string>}
   */
  static get args() {
    let result = [
      '--disable-dev-shm-usage',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-offer-upload-credit-cards',
      '--disable-setuid-sandbox',
      '--enable-async-dns',
      '--enable-simple-cache-backend',
      '--enable-tcp-fast-open',
      '--media-cache-size=33554432',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--no-sandbox',
      '--no-zygote',
      '--prerender-from-omnibox=disabled',
    ];

    if (this.headless === true) {
      result.push('--single-process');
    } else {
      result.push('--start-maximized');
    }

    return result;
  }

  /**
   * Inflates the current version of Chromium and returns the path to the binary.
   * If not running on AWS Lambda, `null` is returned instead.
   *
   * @returns {?Promise<string>}
   */
  static get executablePath() {
    if (this.headless !== true) {
      return null;
    }

    return new Promise(
      (resolve, reject) => {
        let input = path.join(__dirname, '..', 'bin');
        let output = '/tmp/chromium';

        if (fs.existsSync(output) === true) {
          for (let file of fs.readdirSync(`/tmp`)) {
            if (file.startsWith('core.chromium') === true) {
              fs.unlinkSync(`/tmp/${file}`);
            }
          }

          return resolve(output);
        }

        for (let file of fs.readdirSync(input)) {
          if (file.endsWith('.br') === true) {
            input = path.join(input, file);
          }
        }

        const source = fs.createReadStream(input);
        const target = fs.createWriteStream(output);

        source.on('error',
          (error) => {
            return reject(error);
          }
        );

        target.on('error',
          (error) => {
            return reject(error);
          }
        );

        target.on('close',
          () => {
            fs.chmod(output, '0755',
              (error) => {
                if (error) {
                  return reject(error);
                }

                return resolve(output);
              }
            );
          }
        );

        source.pipe(require(`${__dirname}/iltorb`).decompressStream()).pipe(target);
      }
    );
  }

  /**
   * Returns a boolean indicating if we are running on AWS Lambda.
   *
   * @returns {!boolean}
   */
  static get headless() {
    return (process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined);
  }
}

module.exports = Chromium;
