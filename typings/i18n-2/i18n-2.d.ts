
interface I18nStatic{
    __(string,any?);
    new(options:any):any;

}

declare var i18n: I18nStatic;

declare module "i18n-2" {
    export = i18n;
}