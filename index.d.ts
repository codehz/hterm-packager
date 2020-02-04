type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;

type RecordValue = string | number | boolean | object | ArrayLike<any> | null;
type ObserverType = (value: RecordValue, key: string, mgr: lib.PreferenceManager) => void

export namespace lib {
  /**
   * Register an initialization function.
   *
   * The initialization functions are invoked in registration order when
   * lib.init() is invoked.  Each function will receive a single parameter, which
   * is a function to be invoked when it completes its part of the initialization.
   *
   * @param {string} name A short descriptive name of the init routine useful for
   *     debugging.
   * @param {function(function())} callback The initialization function to
   *     register.
   * @return {function(function())} The callback parameter.
   */
  function registerInit(name: string, callback: () => void): () => void

  /**
   * Initialize the library.
   *
   * This will ensure that all registered runtime dependencies are met, and
   * invoke any registered initialization functions.
   *
   * Initialization is asynchronous.  The library is not ready for use until
   * the onInit function is invoked.
   *
   * @param {function()} onInit The function to invoke when initialization is
   *     complete.
   * @param {function(*)=} logFunction An optional function to send initialization
   *     related log messages to.
   */
  function init(onInit: () => void, logFunction: (info: string) => void): void

  /**
   * Verify |condition| is truthy else throw Error.
   *
   * This function is primarily for satisfying the JS compiler and should be
   * used only when you are certain that your condition is true.  The function is
   * designed to have a version that throws Errors in tests if condition fails,
   * and a nop version for production code.  It configures itself the first time
   * it runs.
   *
   * @param {boolean} condition A condition to check.
   * @closurePrimitive {asserts.truthy}
   */
  function assert(condition: boolean): void

  /**
   * Verify |value| is not null and return |value| if so, else throw Error.
   * See lib.assert.
   *
   * @template T
   * @param {T} value A value to check for null.
   * @return {T} A non-null |value|.
   * @closurePrimitive {asserts.truthy}
   */
  function notNull<T>(value: T): void

  /**
   * Verify |value| is not undefined and return |value| if so, else throw Error.
   * See lib.assert.
   *
   * @template T
   * @param {T} value A value to check for null.
   * @return {T} A non-undefined |value|.
   * @closurePrimitive {asserts.truthy}
   */
  function notUndefined<T>(value: T): void

  namespace array {
    /**
     * Concatenate an arbitrary number of typed arrays of the same type into a new
     * typed array of this type.
     *
     * @template TYPED_ARRAY
     * @param {...!TYPED_ARRAY} arrays
     * @return {!TYPED_ARRAY}
     */
    function concatTyped<T extends TypedArray>(...arrays: T[]): T

    /**
     * Compare two array-like objects entrywise.
     *
     * @template ARRAY_LIKE
     * @param {?ARRAY_LIKE} a The first array to compare.
     * @param {?ARRAY_LIKE} b The second array to compare.
     * @return {boolean} true if both arrays are null or they agree entrywise;
     *     false otherwise.
     */
    function compare<E, T extends ArrayLike<E>>(a: T, b: T): boolean
  }

  namespace codec {
    /**
     * Join an array of code units to a string.
     *
     * The code units must not be larger than 65535.  The individual code units may
     * be for UTF-8 or UTF-16 -- it doesn't matter since UTF-16 can handle all UTF-8
     * code units.
     *
     * The input array type may be an Array or a typed Array (e.g. Uint8Array).
     *
     * @param {!Uint8Array|!Array<number>} array The code units to generate for
     *     the string.
     * @return {string} A UTF-16 encoded string.
     */
    function codeUnitArrayToString(array: Uint8Array | Array<number>): string

    /**
     * Create an array of code units from a UTF-16 encoded string.
     *
     * @param {string} str The string to extract code units from.
     * @param {!ArrayBufferView=} ret The buffer to hold the result.  If not set, a
     *     new Uint8Array is created.
     * @return {!ArrayBufferView} The array of code units.
     */
    function stringToCodeUnitArray(str: string, ret?: Uint8Array): Uint8Array
  }

  namespace MessageManager {
    type Definition = {
      message: string,
      description?: string
      placeholders?: { content: string, example: string }
    };
  }
  class MessageManager {
    /**
     * MessageManager class handles internationalized strings.
     *
     * Note: chrome.i18n isn't sufficient because...
     *     1. There's a bug in chrome that makes it unavailable in iframes:
     *        https://crbug.com/130200
     *     2. The client code may not be packaged in a Chrome extension.
     *     3. The client code may be part of a library packaged in a third-party
     *        Chrome extension.
     *
     * @param {!Array<string>} languages List of languages to load, in the order
     *     they are preferred.  The first language found will be used.  'en' is
     *     automatically added as the last language if it is not already present.
     * @param {boolean=} useCrlf If true, '\n' in messages are substituted for
     *     '\r\n'.  This fixes the translation process which discards '\r'
     *     characters.
     * @constructor
     */
    constructor(languages: string[], useCrlf?: boolean)

    /**
     * @typedef {!Object<string, {
     *     message: string,
     *     description: (string|undefined),
     *     placeholders: ({content: string, example: string}|undefined),
     * }>}
     */
    Messages: Record<string, MessageManager>;

    /**
     * Add message definitions to the message manager.
     *
     * This takes an object of the same format of a Chrome messages.json file.  See
     * <https://developer.chrome.com/extensions/i18n-messages>.
     *
     * @param {!lib.MessageManager.Messages} defs The message to add to the
     *     database.
     */
    addMessages(defs: Record<string, MessageManager>): void

    /**
     * Load the first available language message bundle.
     *
     * @param {string} pattern A url pattern containing a "$1" where the locale
     *     name should go.
     */
    findAndLoadMessages(pattern: string): Promise<void>

    /**
     * Load messages from a messages.json file.
     *
     * @param {string} url The URL to load the messages from.
     * @return {!Promise<void>}
     */
    loadMessages(url: string): Promise<void>

    /**
     * Get a message by name, optionally replacing arguments too.
     *
     * @param {string} msgname String containing the name of the message to get.
     * @param {!Array<string>=} args Optional array containing the argument values.
     * @param {string=} fallback Optional value to return if the msgname is not
     *     found.  Returns the message name by default.
     * @return {string} The formatted translation.
     */
    get(msgname: string, args: string[], fallback?: string): string

    /**
     * Process all of the "i18n" html attributes found in a given element.
     *
     * The real work happens in processI18nAttribute.
     *
     * @param {!Element} node The element whose nodes will be translated.
     */
    processI18nAttributes(node: Element): void;

    /**
     * Process the "i18n" attribute in the specified node.
     *
     * The i18n attribute should contain a JSON object.  The keys are taken to
     * be attribute names, and the values are message names.
     *
     * If the JSON object has a "_" (underscore) key, its value is used as the
     * textContent of the element.
     *
     * Message names can refer to other attributes on the same element with by
     * prefixing with a dollar sign.  For example...
     *
     *   <button id='send-button'
     *           i18n='{"aria-label": "$id", "_": "SEND_BUTTON_LABEL"}'
     *           ></button>
     *
     * The aria-label message name will be computed as "SEND_BUTTON_ARIA_LABEL".
     * Notice that the "id" attribute was appended to the target attribute, and
     * the result converted to UPPER_AND_UNDER style.
     *
     * @param {!Element} node The element to translate.
     */
    processI18nAttribute(node: Element): void
  }

  class PreferenceManager {
    /**
     * Constructor for lib.PreferenceManager objects.
     *
     * These objects deal with persisting changes to stable storage and notifying
     * consumers when preferences change.
     *
     * It is intended that the backing store could be something other than HTML5
     * storage, but there aren't any use cases at the moment.  In the future there
     * may be a chrome api to store sync-able name/value pairs, and we'd want
     * that.
     *
     * @param {!lib.Storage} storage The storage object to use as a backing
     *     store.
     * @param {string=} prefix The optional prefix to be used for all preference
     *     names.  The '/' character should be used to separate levels of hierarchy,
     *     if you're going to have that kind of thing.  If provided, the prefix
     *     should start with a '/'.  If not provided, it defaults to '/'.
     * @constructor
     */
    constructor(storage: Storage, prefix: string)

    /**
     * Used internally to indicate that the current value of the preference should
     * be taken from the default value defined with the preference.
     *
     * Equality tests against this value MUST use '===' or '!==' to be accurate.
     *
     * @type {symbol}
     */
    static readonly DEFAULT_VALUE: symbol;

    /**
     * Stop this preference manager from tracking storage changes.
     *
     * Call this if you're going to swap out one preference manager for another so
     * that you don't get notified about irrelevant changes.
     */
    deactivate(): void;

    /**
     * Start tracking storage changes.
     *
     * If you previously deactivated this preference manager, you can reactivate it
     * with this method.  You don't need to call this at initialization time, as
     * it's automatically called as part of the constructor.
     */
    activate(): void;

    /**
     * Read the backing storage for these preferences.
     *
     * You should do this once at initialization time to prime the local cache
     * of preference values.  The preference manager will monitor the backing
     * storage for changes, so you should not need to call this more than once.
     *
     * This function recursively reads storage for all child preference managers as
     * well.
     *
     * This function is asynchronous, if you need to read preference values, you
     * *must* wait for the callback.
     *
     * @param {function()=} opt_callback Optional function to invoke when the read
     *     has completed.
     */
    readStorage(opt_callback?: () => void): void

    /**
     * Define a preference.
     *
     * This registers a name, default value, and onChange handler for a preference.
     *
     * @param {string} name The name of the preference.  This will be prefixed by
     *     the prefix of this PreferenceManager before written to local storage.
     * @param {string|number|boolean|!Object|!Array|null} value The default value of
     *     this preference.  Anything that can be represented in JSON is a valid
     *     default value.
     * @param {function(*, string, !lib.PreferenceManager)=} opt_onChange A
     *     function to invoke when the preference changes.  It will receive the new
     *     value, the name of the preference, and a reference to the
     *     PreferenceManager as parameters.
     */
    definePreference(name: string, value: RecordValue, opt_onChange: ObserverType): void

    /**
     * Define multiple preferences with a single function call.
     *
     * @param {!Array<*>} defaults An array of 3-element arrays.  Each three element
     *     array should contain the [key, value, onChange] parameters for a
     *     preference.
     */
    definePreferences(defaults: [[string, RecordValue, ObserverType]]): void

    /**
     * Define an ordered list of child preferences.
     *
     * Child preferences are different from just storing an array of JSON objects
     * in that each child is an instance of a preference manager.  This means you
     * can observe changes to individual child preferences, and get some validation
     * that you're not reading or writing to an undefined child preference value.
     *
     * @param {string} listName A name for the list of children.  This must be
     *     unique in this preference manager.  The listName will become a
     *     preference on this PreferenceManager used to store the ordered list of
     *     child ids.  It is also used in get/add/remove operations to identify the
     *     list of children to operate on.
     * @param {function(!lib.PreferenceManager, string)} childFactory A function
     *     that will be used to generate instances of these children.  The factory
     *     function will receive the parent lib.PreferenceManager object and a
     *     unique id for the new child preferences.
     */
    defineChildren(listName: string, childFactory: (mgr: PreferenceManager, key: string) => RecordValue): void

    /**
     * Register to observe preference changes.
     *
     * @param {string} name The name of preference you wish to observe..
     * @param {function()} observer The callback.
     */
    addObserver(name: string, obverser: ObserverType): void

    /**
     * Register to observe preference changes.
     *
     * @param {?function()} global A callback that will happen for every preference.
     *     Pass null if you don't need one.
     * @param {!Object} map A map of preference specific callbacks.  Pass null if
     *     you don't need any.
     */
    addObservers(obverser: ObserverType, map: Record<string, RecordValue>): void

    /**
     * Remove preference observer.
     *
     * @param {string} name The name of preference you wish to stop observing.
     * @param {function()} observer The observer to remove.
     */
    removeObserver(name: string, obverser: ObserverType): void

    /**
     * Dispatch the change observers for all known preferences.
     *
     * It may be useful to call this after readStorage completes, in order to
     * get application state in sync with user preferences.
     *
     * This can be used if you've changed a preference manager out from under
     * a live object, for example when switching to a different prefix.
     */
    notifyAll(): void

    /**
     * Create a new child PreferenceManager for the given child list.
     *
     * The optional hint parameter is an opaque prefix added to the auto-generated
     * unique id for this child.  Your child factory can parse out the prefix
     * and use it.
     *
     * @param {string} listName The child list to create the new instance from.
     * @param {?string=} opt_hint Optional hint to include in the child id.
     * @param {string=} opt_id Optional id to override the generated id.
     * @return {!lib.PreferenceManager} The new child preference manager.
     */
    createChild(listName: string, opt_hint?: string, opt_id?: string): PreferenceManager

    /**
     * Remove a child preferences instance.
     *
     * Removes a child preference manager and clears any preferences stored in it.
     *
     * @param {string} listName The name of the child list containing the child to
     *     remove.
     * @param {string} id The child ID.
     */
    removeChild(listName: string, id: string): void

    /**
     * Return a child PreferenceManager instance for a given id.
     *
     * If the child list or child id is not known this will return the specified
     * default value or throw an exception if no default value is provided.
     *
     * @param {string} listName The child list to look in.
     * @param {string} id The child ID.
     * @param {!lib.PreferenceManager=} opt_default The value to return if the child
     *     is not found.
     * @return {!lib.PreferenceManager} The specified child PreferenceManager.
     */
    getChild(listName: string, id: string, opt_default?: PreferenceManager): PreferenceManager

    /**
     * Synchronize a list of child PreferenceManagers instances with the current
     * list stored in prefs.
     *
     * This will instantiate any missing managers and read current preference values
     * from storage.  Any active managers that no longer appear in preferences will
     * be deleted.
     *
     * @param {string} listName The child list to synchronize.
     * @param {function()=} opt_callback Function to invoke when the sync finishes.
     */
    syncChildList(listName: string, opt_callback: () => void): void

    /**
     * Reset a preference to its default state.
     *
     * This will dispatch the onChange handler if the preference value actually
     * changes.
     *
     * @param {string} name The preference to reset.
     */
    reset(name: string): void

    /**
     * Reset all preferences back to their default state.
     */
    resetAll(): void

    /**
     * Return true if two values should be considered not-equal.
     *
     * If both values are the same scalar type and compare equal this function
     * returns false (no difference), otherwise return true.
     *
     * This is used in places where we want to check if a preference has changed.
     * Rather than take the time to compare complex values we just consider them
     * to always be different.
     *
     * @param {*} a A value to compare.
     * @param {*} b A value to compare.
     * @return {boolean} Whether the two are not equal.
     */
    diff(a: RecordValue, b: RecordValue): boolean

    /**
     * Change the default value of a preference.
     *
     * This is useful when subclassing preference managers.
     *
     * The function does not alter the current value of the preference, unless
     * it has the old default value.  When that happens, the change observers
     * will be notified.
     *
     * @param {string} name The name of the parameter to change.
     * @param {*} newValue The new default value for the preference.
     */
    changeDefault(name: string, newValue: RecordValue): void

    /**
     * Change the default value of multiple preferences.
     *
     * @param {!Object} map A map of name -> value pairs specifying the new default
     *     values.
     */
    changeDefaults(map: Record<string, RecordValue>): void

    /**
     * Set a preference to a specific value.
     *
     * This will dispatch the onChange handler if the preference value actually
     * changes.
     *
     * @param {string} name The preference to set.
     * @param {*} newValue The value to set.  Anything that can be represented in
     *     JSON is a valid value.
     * @param {function()=} onComplete Callback when the set call completes.
     * @param {boolean=} saveToStorage Whether to commit the change to the backing
     *     storage or only the in-memory record copy.
     * @return {!Promise<void>} Promise which resolves once all observers are
     *     notified.
     */
    set(name: string, newValue: RecordValue, onComplete?: () => void, saveToStorage?: boolean): Promise<void>

    /**
     * Get the value of a preference.
     *
     * @param {string} name The preference to get.
     * @return {*} The preference's value.
     */
    get(name: string): RecordValue

    /**
     * Get the boolean value of a preference.
     *
     * @param {string} name The preference to get.
     * @return {boolean}
     */
    getBoolean(name: string): boolean

    /**
     * Get the number value of a preference.
     *
     * @param {string} name The preference to get.
     * @return {number}
     */
    getNumber(name: string): number

    /**
     * Get the string value of a preference.
     *
     * @param {string} name The preference to get.
     * @return {string}
     */
    getString(name: string): string

    /**
     * Return all non-default preferences as a JSON object.
     *
     * This includes any nested preference managers as well.
     *
     * @return {!Object} The JSON preferences.
     */
    exportAsJson(): string

    /**
     * Import a JSON blob of preferences previously generated with exportAsJson.
     *
     * This will create nested preference managers as well.
     *
     * @param {!Object} json The JSON settings to import.
     * @param {function()=} onComplete Callback when all imports have finished.
     */
    importFromJson(json: string, onComplete: () => void): void
  }
  namespace PreferenceManager {
    class Record {
      /**
       * An individual preference.
       *
       * These objects are managed by the PreferenceManager, you shouldn't need to
       * handle them directly.
       *
       * @param {string} name The name of the new preference (used for indexing).
       * @param {*} defaultValue The default value for this preference.
       * @constructor
       */
      constructor(name: string, defaultValue: RecordValue)

      /**
       * A local copy of the DEFAULT_VALUE constant to make it less verbose.
       *
       * @type {symbol}
       */
      static readonly DEFAULT_VALUE: symbol;

      /**
       * Register a callback to be invoked when this preference changes.
       *
       * @param {function(string, string, !lib.PreferenceManager)} observer The
       *     function to invoke.  It will receive the new value, the name of the
       *     preference, and a reference to the PreferenceManager as parameters.
       */
      addObserver(observer: ObserverType): void

      /**
       * Unregister an observer callback.
       *
       * @param {function()} observer A previously registered callback.
       */
      removeObserver(observer: ObserverType): void

      /**
       * Fetch the value of this preference.
       *
       * @return {*} The value for this preference.
       */
      get(): RecordValue
    }
  }

  /**
   * Namespace for implementations of persistent, possibly cloud-backed
   * storage.
   *
   * @interface
   */
  interface Storage {
    /**
     * Register a function to observe storage changes.
     *
     * @param {function(!Object)} callback The function to invoke when the storage
     *     changes.
     */
    addObserver(callback: (obj: Object) => void): void

    /**
     * Unregister a change observer.
     *
     * @param {function(!Object)} callback A previously registered callback.
     */
    removeObserver(callback: (obj: Object) => void): void

    /**
     * Delete everything in this storage.
     *
     * @param {function()=} callback The function to invoke when the delete has
     *     completed.
     */
    clear(callback: () => void): void

    /**
     * Return the current value of a storage item.
     *
     * @param {string} key The key to look up.
     * @param {function(*)} callback The function to invoke when the value has
     *     been retrieved.
     */
    getItem(key: string, callback: (value: RecordValue) => void): void

    /**
     * Fetch the values of multiple storage items.
     *
     * @param {?Array<string>} keys The keys to look up.  Pass null for all keys.
     * @param {function(!Object)} callback The function to invoke when the values
     *     have been retrieved.
     */
    getItems(keys: string[], callback: (value: RecordValue[]) => void): void

    /**
     * Set a value in storage.
     *
     * @param {string} key The key for the value to be stored.
     * @param {*} value The value to be stored.  Anything that can be serialized
     *     with JSON is acceptable.
     * @param {function()=} callback Function to invoke when the set is complete.
     *     You don't have to wait for the set to complete in order to read the value
     *     since the local cache is updated synchronously.
     */
    setItem(key: string, value: RecordValue, callback?: () => void): void

    /**
     * Set multiple values in storage.
     *
     * @param {!Object} obj A map of key/values to set in storage.
     * @param {function()=} callback Function to invoke when the set is complete.
     *     You don't have to wait for the set to complete in order to read the value
     *     since the local cache is updated synchronously.
     */
    setItems(obj: Record<string, RecordValue>, callback?: () => void): void

    /**
     * Remove an item from storage.
     *
     * @param {string} key The key to be removed.
     * @param {function()=} callback Function to invoke when the remove is complete.
     *     You don't have to wait for the set to complete in order to read the value
     *     since the local cache is updated synchronously.
     */
    removeItem(key: string, callback?: () => void): void

    /**
     * Remove multiple items from storage.
     *
     * @param {!Array<string>} ary The keys to be removed.
     * @param {function()=} callback Function to invoke when the remove is complete.
     *     You don't have to wait for the set to complete in order to read the value
     *     since the local cache is updated synchronously.
     */
    removeItems(ary: string[], callback?: () => void): void
  }

  namespace Storage {
    /**
     * chrome.storage based class with an async interface that is interchangeable
     * with other lib.Storage.* implementations.
     *
     * @param {!StorageArea} storage The backing storage.
     * @implements {lib.Storage}
     * @constructor
     */
    const Chrome: new () => Storage

    /**
     * window.localStorage based class with an async interface that is
     * interchangeable with other lib.Storage.* implementations.
     *
     * @implements {lib.Storage}
     * @constructor
     */
    const Local: new () => Storage

    /**
     * In-memory storage class with an async interface that is interchangeable with
     * other lib.Storage.* implementations.
     *
     * @constructor
     * @implements {lib.Storage}
     */
    const Memory: new () => Storage

    /**
     * Storage implementation using chrome.settingsPrivate.
     *
     * @param {function()} callback Callback invoked when object is ready.
     * @constructor
     * @implements {lib.Storage}
     */
    const TerminalPrivate: new () => Storage
  }
}
export namespace hterm {
  /**
   * The type of window hosting hterm.
   *
   * This is set as part of hterm.init().  The value is invalid until
   * initialization completes.
   */
  const windowType: 'none' | 'normal' | 'popup'

  /**
   * The OS we're running under.
   *
   * Used when setting up OS-specific behaviors.
   *
   * This is set as part of hterm.init().  The value is invalid until
   * initialization completes.
   */
  const os: 'cros' | 'mac' | 'linux' | 'android' | 'windows' | 'node'

  /**
   * Warning message to display in the terminal when browser zoom is enabled.
   *
   * You can replace it with your own localized message.
   */
  const zoomWarningMessage: string

  /**
   * Brief overlay message displayed when text is copied to the clipboard.
   *
   * By default it is the unicode BLACK SCISSORS character, but you can
   * replace it with your own localized message.
   *
   * This is only displayed when the 'enable-clipboard-notice' preference
   * is enabled.
   */
  const notifyCopyMessage: string

  /**
   * Text shown in a desktop notification for the terminal
   * bell.  \u226a is a unicode EIGHTH NOTE, %(title) will
   * be replaced by the terminal title.
   */
  const desktopNotificationTitle: string

  /** @type {?lib.MessageManager} */
  const messageManager: lib.MessageManager

  /**
   * Return decimal { width, height } for a given DOM element.
   *
   * @param {!Element} element The element whose size to lookup.
   * @return {!DOMRect} The size of the element.
   */
  function getClientSize(element: Element): DOMRect

  /**
   * Return decimal width for a given DOM element.
   *
   * @param {!Element} element The element whose width to lookup.
   * @return {number} The width of the element.
   */
  function getClientWidth(element: Element): number

  /**
   * Return decimal height for a given DOM element.
   *
   * @param {!Element} element The element whose height to lookup.
   * @return {number} The height of the element.
   */
  function getClientHeight(element: Element): number

  /**
   * Copy the specified text to the system clipboard.
   *
   * We'll create selections on demand based on the content to copy.
   *
   * @param {!Document} document The document with the selection to copy.
   * @param {string} str The string data to copy out.
   * @return {!Promise<void>}
   */
  function copySelectionToClipboard(document: Document, str: string): Promise<void>

  /**
   * Paste the system clipboard into the element with focus.
   *
   * Note: In Chrome/Firefox app/extension environments, you'll need the
   * "clipboardRead" permission.  In other environments, this might always
   * fail as the browser frequently blocks access for security reasons.
   *
   * @param {!Document} document The document to paste into.
   * @return {boolean} True if the paste succeeded.
   */
  function pasteFromClipboard(document: Document): boolean

  /**
   * Return a formatted message in the current locale.
   *
   * @param {string} name The name of the message to return.
   * @param {!Array<string>=} args The message arguments, if required.
   * @param {string=} string The default message text.
   * @return {string} The localized message.
   */
  function msg(name: string, args?: string[], string?: string): string

  /**
   * Create a new notification.
   *
   * @param {{title:(string|undefined), body:(string|undefined)}=} params Various
   *     parameters for the notification.
   *     title The title (defaults to the window's title).
   *     body The message body (main text).
   * @return {!Notification}
   */
  function notify(params: {
    title?: string;
    body?: string;
  }): Notification

  /**
   * Launches url in a new tab.
   *
   * @param {string} url URL to launch in a new tab.
   */
  function openUrl(url: string): void

  class Size {
    width: number
    height: number
    /**
     * Constructor for a hterm.Size record.
     *
     * Instances of this class have public read/write members for width and height.
     *
     * @param {number} width The width of this record.
     * @param {number} height The height of this record.
     * @constructor
     */
    constructor(width: number, height: number)

    /**
     * Adjust the width and height of this record.
     *
     * @param {number} width The new width of this record.
     * @param {number} height The new height of this record.
     */
    resize(width: number, height: number): void

    /**
     * Return a copy of this record.
     *
     * @return {!hterm.Size} A new hterm.Size instance with the same width and
     *     height.
     */
    clone(): this

    /**
     * Set the height and width of this instance based on another hterm.Size.
     *
     * @param {!hterm.Size} that The object to copy from.
     */
    setTo(that: this): void

    /**
     * Test if another hterm.Size instance is equal to this one.
     *
     * @param {!hterm.Size} that The other hterm.Size instance.
     * @return {boolean} True if both instances have the same width/height, false
     *     otherwise.
     */
    equals(that: this): boolean

    /**
     * Return a string representation of this instance.
     *
     * @return {string} A string that identifies the width and height of this
     *     instance.
     * @override
     */
    toString(): string
  }

  class RowCol {
    /**
     * Constructor for a hterm.RowCol record.
     *
     * Instances of this class have public read/write members for row and column.
     *
     * This class includes an 'overflow' bit which is use to indicate that an
     * attempt has been made to move the cursor column passed the end of the
     * screen.  When this happens we leave the cursor column set to the last column
     * of the screen but set the overflow bit.  In this state cursor movement
     * happens normally, but any attempt to print new characters causes a cr/lf
     * first.
     *
     * @param {number} row The row of this record.
     * @param {number} column The column of this record.
     * @param {boolean=} opt_overflow Optional boolean indicating that the RowCol
     *     has overflowed.
     * @constructor
     */
    constructor(row: number, column: number, opt_overflow?: boolean)

    /**
     * Adjust the row and column of this record.
     *
     * @param {number} row The new row of this record.
     * @param {number} column The new column of this record.
     * @param {boolean=} opt_overflow Optional boolean indicating that the RowCol
     *     has overflowed.
     */
    move(row: number, column: number, opt_overflow?: boolean): void

    /**
     * Return a copy of this record.
     *
     * @return {!hterm.RowCol} A new hterm.RowCol instance with the same row and
     *     column.
     */
    clone(): this

    /**
     * Set the row and column of this instance based on another hterm.RowCol.
     *
     * @param {!hterm.RowCol} that The object to copy from.
     */
    setTo(that: this): void

    /**
     * Test if another hterm.RowCol instance is equal to this one.
     *
     * @param {!hterm.RowCol} that The other hterm.RowCol instance.
     * @return {boolean} True if both instances have the same row/column, false
     *     otherwise.
     */
    equals(that: this): boolean

    /**
     * Return a string representation of this instance.
     *
     * @return {string} A string that identifies the row and column of this
     *     instance.
     * @override
     */
    toString(): string
  }

  namespace AccessibilityReader {
    /**
     * Delay in ms to use for merging strings to output.
     *
     * We merge strings together to avoid hanging the terminal and to ensure that
     * aria updates make it to the screen reader. We want this to be short so
     * there's not a big delay between typing/executing commands and hearing output.
     *
     * @const
     * @type {number}
     */
    const DELAY: number
  }

  class AccessibilityReader {
    /**
     * AccessibilityReader responsible for rendering command output for AT.
     *
     * Renders command output for Assistive Technology using a live region. We don't
     * use the visible rows of the terminal for rendering command output to the
     * screen reader because the rendered content may be different from what we want
     * read out by a screen reader. For example, we may not actually render every
     * row of a large piece of output to the screen as it wouldn't be performant.
     * But we want the screen reader to read it all out in order.
     *
     * @param {!Element} div The div element where the live region should be
     *     added.
     * @constructor
     */
    constructor(div: Element)

    /**
     * Enable accessibility-friendly features that have a performance impact.
     *
     * @param {boolean} enabled Whether to enable accessibility-friendly features.
     */
    setAccessibilityEnabled(enabled: boolean): void

    /**
     * Decorate the document where the terminal <x-screen> resides. This is needed
     * for listening to keystrokes on the screen.
     *
     * @param {!Document} doc The document where the <x-screen> resides.
     */
    decorate(doc: Document): void

    /**
     * This should be called before the cursor on the screen is about to get
     * updated. This allows cursor changes to be tracked and related notifications
     * to be announced.
     *
     * @param {string} cursorRowString The text in the row that the cursor is
     *     currently on.
     * @param {number} cursorRow The index of the row that the cursor is currently
     *     on, including rows in the scrollback buffer.
     * @param {number} cursorColumn The index of the column that the cursor is
     *     currently on.
     */
    beforeCursorChange(cursorRowString: string, cursorRow: number, cursorColumn: number): void

    /**
     * This should be called after the cursor on the screen has been updated. Note
     * that several updates to the cursor may have happened between
     * beforeCursorChange and afterCursorChange.
     *
     * This allows cursor changes to be tracked and related notifications to be
     * announced.
     *
     * @param {string} cursorRowString The text in the row that the cursor is
     *     currently on.
     * @param {number} cursorRow The index of the row that the cursor is currently
     *     on, including rows in the scrollback buffer.
     * @param {number} cursorColumn The index of the column that the cursor is
     *     currently on.
     */
    afterCursorChange(cursorRowString: string, cursorRow: number, cursorColumn: number): void

    /**
     * Announce the command output.
     *
     * @param {string} str The string to announce using a live region.
     */
    announce(str: string): void

    /**
     * Voice an announcement that will interrupt other announcements.
     *
     * @param {string} str The string to announce using a live region.
     */
    assertiveAnnounce(str: string): void

    /**
     * Add a newline to the text that will be announced to the live region.
     */
    newLine(): void

    /**
     * Clear the live region and any in-flight announcements.
     */
    clear(): void
  }

  namespace ContextMenu {
    type Item = { name: (string | symbol), action: (e: Event) => void }
    const SEPARATOR: symbol
  }

  class ContextMenu {
    /**
     * Manage the context menu usually shown when right clicking.
     *
     * @constructor
     */
    constructor()

    /**
     * Bind context menu to a specific document element.
     *
     * @param {!Document} document The document to use when creating elements.
     */
    setDocument(document: Document): void

    /**
     * Set all the entries in the context menu.
     *
     * This is an array of arrays.  The first element in the array is the string to
     * display while the second element is the function to call.
     *
     * The first element may also be the SEPARATOR constant to add a separator.
     *
     * This resets all existing menu entries.
     *
     * @param {!Array<!hterm.ContextMenu.Item>} items The menu entries.
     */
    setItems(items: ContextMenu.Item[]): void

    /**
     * Show the context menu.
     *
     * The event is used to determine where to show the menu.
     *
     * If no menu entries are defined, then nothing will be shown.
     *
     * @param {!Event} e The event triggering this display.
     * @param {!hterm.Terminal=} terminal The terminal object to get style info
     *     from.
     */
    show(e: Event, terminal: hterm.Terminal): void

    /**
     * Hide the context menu.
     */
    hide(): void
  }

  class Frame {
    /**
     * Construct a new frame for the given terminal.
     *
     * @param {!hterm.Terminal} terminal The parent terminal object.
     * @param {string} url The url to load in the frame.
     * @param {!Object=} opt_options Optional options for the frame.  Not
     *     implemented.
     * @constructor
     */
    constructor(terminal: hterm.Terminal, url: string, opt_options?: {})

    /**
     * Handle messages from the iframe.
     *
     * @param {!MessageEvent} e The message to process.
     */
    onMessage: (e: MessageEvent) => void

    /**
     * Handle iframe onLoad event.
     */
    onLoad: () => void

    /**
     * Close this frame.
     */
    close(): void

    /**
     * Clients may override this.
     */
    onClose: () => void

    /**
     * Send a message to the iframe.
     *
     * @param {string} name The message name.
     * @param {!Array=} argv The message arguments.
     */
    postMessage(name: string, argv: ArrayLike<any>): void

    /**
     * Show the UI for this frame.
     *
     * The iframe src is not loaded until this method is called.
     */
    show(): void
  }

  class Keyboard {
    /**
     * Keyboard handler.
     *
     * Consumes onKey* events and invokes onVTKeystroke on the associated
     * hterm.Terminal object.
     *
     * See also: [XTERM] as referenced in vt.js.
     *
     * @param {!hterm.Terminal} terminal The Terminal object associated with this
     *     keyboard.
     * @constructor
     */
    constructor(terminal: hterm.Terminal)

    // The parent vt interpreter.
    terminal: hterm.Terminal

    /**
     * The current key map.
     */
    keyMap: hterm.Keyboard.KeyMap

    bindings: hterm.Keyboard.Bindings

    /**
     * none: Disable any AltGr related munging.
     * ctrl-alt: Assume Ctrl+Alt means AltGr.
     * left-alt: Assume left Alt means AltGr.
     * right-alt: Assume right Alt means AltGr.
     */
    altGrMode: 'none' | 'ctrl-alt' | 'left-alt' | 'right-alt'

    /**
     * If true, Shift-Insert will fall through to the browser as a paste.
     * If false, the keystroke will be sent to the host.
     */
    shiftInsertPaste: boolean

    /**
     * If true, home/end will control the terminal scrollbar and shift home/end
     * will send the VT keycodes.  If false then home/end sends VT codes and
     * shift home/end scrolls.
     */
    homeKeysScroll: boolean

    /**
     * Same as above, except for page up/page down.
     */
    pageKeysScroll: boolean

    /**
     * If true, Ctrl-Plus/Minus/Zero controls zoom.
     * If false, Ctrl-Shift-Plus/Minus/Zero controls zoom, Ctrl-Minus sends ^_,
     * Ctrl-Plus/Zero do nothing.
     */
    ctrlPlusMinusZeroZoom: boolean

    /**
     * Ctrl+C copies if true, sends ^C to host if false.
     * Ctrl+Shift+C sends ^C to host if true, copies if false.
     */
    ctrlCCopy: boolean

    /**
     * Ctrl+V pastes if true, sends ^V to host if false.
     * Ctrl+Shift+V sends ^V to host if true, pastes if false.
     */
    ctrlVPaste: boolean

    /**
     * Enable/disable application keypad.
     *
     * This changes the way numeric keys are sent from the keyboard.
     */
    applicationKeypad: boolean

    /**
     * Enable/disable the application cursor mode.
     *
     * This changes the way cursor keys are sent from the keyboard.
     */
    applicationCursor: boolean

    /**
     * If true, the backspace should send BS ('\x08', aka ^H).  Otherwise
     * the backspace key should send '\x7f'.
     */
    backspaceSendsBackspace: boolean

    /**
     * Set whether the meta key sends a leading escape or not.
     */
    metaSendsEscape: boolean

    /**
     * Set whether meta-V gets passed to host.
     */
    passMetaV: boolean

    /**
     * Controls how the alt key is handled.
     *
     *  escape....... Send an ESC prefix.
     *  8-bit........ Add 128 to the unshifted character as in xterm.
     *  browser-key.. Wait for the keypress event and see what the browser says.
     *                (This won't work well on platforms where the browser
     *                 performs a default action for some alt sequences.)
     *
     * This setting only matters when alt is distinct from meta (altIsMeta is
     * false.)
     */
    altSendsWhat: 'escape' | '8-bit' | 'browser-key'

    /**
     * Set whether the alt key acts as a meta key, instead of producing 8-bit
     * characters.
     *
     * True to enable, false to disable, null to autodetect based on platform.
     */
    altIsMeta: boolean

    /**
     * If true, tries to detect DEL key events that are from alt-backspace on
     * Chrome OS vs from a true DEL key press.
     *
     * Background: At the time of writing, on Chrome OS, alt-backspace is mapped
     * to DEL. Some users may be happy with this, but others may be frustrated
     * that it's impossible to do meta-backspace. If the user enables this pref,
     * we use a trick to tell a true DEL keypress from alt-backspace: on
     * alt-backspace, we will see the alt key go down, then get a DEL keystroke
     * that indicates that alt is not pressed. See https://crbug.com/174410 .
     */
    altBackspaceIsMetaBackspace: boolean

    /**
     * Used to keep track of the current alt-key state, which is necessary for
     * the altBackspaceIsMetaBackspace preference above and for the altGrMode
     * preference.  This is a bitmap with where bit positions correspond to the
     * "location" property of the key event.
     */
    altKeyPressed: number

    /**
     * If true, Chrome OS media keys will be mapped to their F-key equivalent.
     * E.g. "Back" will be mapped to F1. If false, Chrome will handle the keys.
     */
    mediaKeysAreFKeys: boolean

    /**
     * Capture keyboard events sent to the associated element.
     *
     * This enables the keyboard.  Captured events are consumed by this class
     * and will not perform their default action or bubble to other elements.
     *
     * Passing a null element will uninstall the keyboard handlers.
     *
     * @param {?Element} element The element whose events should be captured, or
     *     null to disable the keyboard.
     */
    installKeyboard(element: Element): void

    /**
     * Disable keyboard event capture.
     *
     * This will allow the browser to process key events normally.
     */
    uninstallKeyboard(): void
  }

  namespace Keyboard {
    /**
     * Call preventDefault and stopPropagation for this key event and nothing
     * else.
     */
    const CANCEL: symbol

    /**
     * This performs the default terminal action for the key.  If used in the
     * 'normal' action and the the keystroke represents a printable key, the
     * character will be sent to the host.  If used in one of the modifier
     * actions, the terminal will perform the normal action after (possibly)
     * altering it.
     *
     *  - If the normal sequence starts with CSI, the sequence will be adjusted
     *    to include the modifier parameter as described in [XTERM] in the final
     *    table of the "PC-Style Function Keys" section.
     *
     *  - If the control key is down and the key represents a printable character,
     *    and the uppercase version of the unshifted keycap is between
     *    64 (ASCII '@') and 95 (ASCII '_'), then the uppercase version of the
     *    unshifted keycap minus 64 is sent.  This makes '^@' send '\x00' and
     *    '^_' send '\x1f'.  (Note that one higher that 0x1f is 0x20, which is
     *    the first printable ASCII value.)
     *
     *  - If the alt key is down and the key represents a printable character then
     *    the value of the character is shifted up by 128.
     *
     *  - If meta is down and configured to send an escape, '\x1b' will be sent
     *    before the normal action is performed.
     */
    const DEFAULT: symbol

    /**
     * Causes the terminal to opt out of handling the key event, instead letting
     * the browser deal with it.
     */
    const PASS: symbol

    /**
     * Insert the first or second character of the keyCap, based on e.shiftKey.
     * The key will be handled in onKeyDown, and e.preventDefault() will be
     * called.
     *
     * It is useful for a modified key action, where it essentially strips the
     * modifier while preventing the browser from reacting to the key.
     */
    const STRIP: symbol

    type KeyDown = {
      keyCode: number,
      shift: (boolean | undefined),
      ctrl: (boolean | undefined),
      alt: (boolean | undefined),
      meta: (boolean | undefined),
    }

    type KeyActions = {
      /**
       * Call preventDefault and stopPropagation for this key event and nothing
       * else.
       */
      readonly CANCEL: unique symbol,

      /**
       * This performs the default terminal action for the key.  If used in the
       * 'normal' action and the the keystroke represents a printable key, the
       * character will be sent to the host.  If used in one of the modifier
       * actions, the terminal will perform the normal action after (possibly)
       * altering it.
       *
       *  - If the normal sequence starts with CSI, the sequence will be adjusted
       *    to include the modifier parameter as described in [XTERM] in the final
       *    table of the "PC-Style Function Keys" section.
       *
       *  - If the control key is down and the key represents a printable character,
       *    and the uppercase version of the unshifted keycap is between
       *    64 (ASCII '@') and 95 (ASCII '_'), then the uppercase version of the
       *    unshifted keycap minus 64 is sent.  This makes '^@' send '\x00' and
       *    '^_' send '\x1f'.  (Note that one higher that 0x1f is 0x20, which is
       *    the first printable ASCII value.)
       *
       *  - If the alt key is down and the key represents a printable character then
       *    the value of the character is shifted up by 128.
       *
       *  - If meta is down and configured to send an escape, '\x1b' will be sent
       *    before the normal action is performed.
       */
      readonly DEFAULT: unique symbol,

      /**
       * Causes the terminal to opt out of handling the key event, instead letting
       * the browser deal with it.
       */
      readonly PASS: unique symbol,

      /**
       * Insert the first or second character of the keyCap, based on e.shiftKey.
       * The key will be handled in onKeyDown, and e.preventDefault() will be
       * called.
       *
       * It is useful for a modified key action, where it essentially strips the
       * modifier while preventing the browser from reacting to the key.
       */
      readonly STRIP: unique symbol
    }

    type KeyAction = keyof hterm.Keyboard.KeyActions | string

    type KeyBindingFunction = (terminal: hterm.Terminal, keydown: hterm.Keyboard.KeyDown) => hterm.Keyboard.KeyAction

    type KeyBindingAction = hterm.Keyboard.KeyAction | hterm.Keyboard.KeyBindingFunction

    type KeyBinding = {
      keyPattern: hterm.Keyboard.KeyPattern;
      action: hterm.Keyboard.KeyBindingAction;
    }

    class Bindings {
      /**
       * A mapping from hterm.Keyboard.KeyPattern to an action.
       *
       * TODO(rginda): For now this bindings code is only used for user overrides.
       * hterm.Keyboard.KeyMap still handles all of the built-in key mappings.
       * It'd be nice if we migrated that over to be hterm.Keyboard.Bindings based.
       *
       * @constructor
       */
      constructor()

      /**
       * Remove all bindings.
       */
      clear(): void

      /**
       * Add a new binding.
       *
       * If a binding for the keyPattern already exists it will be overridden.
       *
       * More specific keyPatterns take precedence over those with wildcards.  Given
       * bindings for "Ctrl-A" and "Ctrl-*-A", and a "Ctrl-A" keydown, the "Ctrl-A"
       * binding will match even if "Ctrl-*-A" was created last.
       *
       * If action is a string, it will be passed through hterm.Parser.parseKeyAction.
       *
       * For example:
       *   // Will replace Ctrl-P keystrokes with the string "hiya!".
       *   addBinding('Ctrl-P', "'hiya!'");
       *   // Will cancel the keystroke entirely (make it do nothing).
       *   addBinding('Alt-D', hterm.Keyboard.KeyActions.CANCEL);
       *   // Will execute the code and return the action.
       *   addBinding('Ctrl-T', function() {
       *     console.log('Got a T!');
       *     return hterm.Keyboard.KeyActions.PASS;
       *   });
       *
       * @param {string|!hterm.Keyboard.KeyPattern} key
       * @param {!hterm.Keyboard.KeyBindingAction} action
       */
      addBinding(key: string | hterm.Keyboard.KeyPattern, action: hterm.Keyboard.KeyBindingAction): void

      /**
       * Add multiple bindings at a time using a map of {string: string, ...}
       *
       * This uses hterm.Parser to parse the maps key into KeyPatterns, and the
       * map values into {!hterm.Keyboard.KeyBindingAction}.
       *
       * For example:
       *  {
       *    // Will replace Ctrl-P keystrokes with the string "hiya!".
       *    'Ctrl-P': "'hiya!'",
       *    // Will cancel the keystroke entirely (make it do nothing).
       *    'Alt-D': hterm.Keyboard.KeyActions.CANCEL,
       *  }
       *
       * @param {!Object<string, !hterm.Keyboard.KeyBindingAction>} map
       */
      addBindings(map: Record<string, hterm.Keyboard.KeyBindingAction>): void

      /**
       * Return the binding that is the best match for the given keyDown record,
       * or null if there is no match.
       *
       * @param {!hterm.Keyboard.KeyDown} keyDown An object with a keyCode property
       *     and zero or more boolean properties representing key modifiers.  These
       *     property names must match those defined in
       *     hterm.Keyboard.KeyPattern.modifiers.
       * @return {?hterm.Keyboard.KeyBinding} The keyboard binding for this key.
       */
      getBinding(keyDown: hterm.Keyboard.KeyDown): hterm.Keyboard.KeyBinding
    }

    type KeyDef = {
      keyCap: string;
      normal: hterm.Keyboard.KeyDefAction;
      control: hterm.Keyboard.KeyDefAction;
      alt: hterm.Keyboard.KeyDefAction;
      meta: hterm.Keyboard.KeyDefAction;
    }

    type KeyDefFunction = (e: KeyboardEvent, def: hterm.Keyboard.KeyDef) => hterm.Keyboard.KeyAction

    type KeyDefAction = hterm.Keyboard.KeyAction | hterm.Keyboard.KeyDefFunction

    class KeyMap {
      /**
       * The default key map for hterm.
       *
       * Contains a mapping of keyCodes to keyDefs (aka key definitions).  The key
       * definition tells the hterm.Keyboard class how to handle keycodes.
       *
       * This should work for most cases, as the printable characters get handled
       * in the keypress event.  In that case, even if the keycap is wrong in the
       * key map, the correct character should be sent.
       *
       * Different layouts, such as Dvorak should work with this keymap, as those
       * layouts typically move keycodes around on the keyboard without disturbing
       * the actual keycaps.
       *
       * There may be issues with control keys on non-US keyboards or with keyboards
       * that very significantly from the expectations here, in which case we may
       * have to invent new key maps.
       *
       * The sequences defined in this key map come from [XTERM] as referenced in
       * vt.js, starting with the section titled "Alt and Meta Keys".
       *
       * @param {!hterm.Keyboard} keyboard
       * @constructor
       */
      constructor(keyboard: hterm.Keyboard)

      /**
       * Add a single key definition.
       *
       * The definition is an object containing the following fields: 'keyCap',
       * 'normal', 'control', 'alt', and 'meta'.
       *
       *  - keyCap is a string identifying the key on the keyboard.  For printable
       *    keys, the key cap should be exactly two characters, starting with the
       *    unshifted version.  For example, 'aA', 'bB', '1!' and '=+'.  For
       *    non-printable the key cap should be surrounded in square braces, as in
       *    '[INS]', '[LEFT]'.  By convention, non-printable keycaps are in uppercase
       *    but this is not a strict requirement.
       *
       *  - Normal is the action that should be performed when the key is pressed
       *    in the absence of any modifier.  See below for the supported actions.
       *
       *  - Control is the action that should be performed when the key is pressed
       *    along with the control modifier.  See below for the supported actions.
       *
       *  - Alt is the action that should be performed when the key is pressed
       *    along with the alt modifier.  See below for the supported actions.
       *
       *  - Meta is the action that should be performed when the key is pressed
       *    along with the meta modifier.  See below for the supported actions.
       *
       * Actions can be one of the hterm.Keyboard.KeyActions as documented below,
       * a literal string, or an array.  If the action is a literal string then
       * the string is sent directly to the host.  If the action is an array it
       * is taken to be an escape sequence that may be altered by modifier keys.
       * The second-to-last element of the array will be overwritten with the
       * state of the modifier keys, as specified in the final table of "PC-Style
       * Function Keys" from [XTERM].
       *
       * @param {number} keyCode The KeyboardEvent.keyCode to match against.
       * @param {!hterm.Keyboard.KeyDef} def The actions this key triggers.
       */
      addKeyDef(keyCode: number, def: hterm.Keyboard.KeyDef): void

      /**
       * Set up the default state for this keymap.
       */
      reset(): void
    }

    class KeyPattern {
      /**
       * A record of modifier bits and keycode used to define a key binding.
       *
       * The modifier names are enumerated in the static KeyPattern.modifiers
       * property below.  Each modifier can be true, false, or "*".  True means
       * the modifier key must be present, false means it must not, and "*" means
       * it doesn't matter.
       *
       * @param {!hterm.Keyboard.KeyDown} spec
       * @constructor
       */
      constructor(spec: hterm.Keyboard.KeyDown)

      /**
       * Valid modifier names.
       */
      static readonly modifiers: ['shift', 'ctrl', 'alt', 'meta']

      /**
       * A compare callback for Array.prototype.sort().
       *
       * The bindings code wants to be sure to search through the strictest key
       * patterns first, so that loosely defined patterns have a lower priority than
       * exact patterns.
       *
       * @param {!hterm.Keyboard.KeyPattern} a
       * @param {!hterm.Keyboard.KeyPattern} b
       * @return {number}
       */
      static sortCompare(a: hterm.Keyboard.KeyPattern, b: hterm.Keyboard.KeyPattern): number

      /**
       * Return true if the given keyDown object is a match for this key pattern.
       *
       * @param {!hterm.Keyboard.KeyDown} keyDown An object with a keyCode property
       *     and zero or more boolean properties representing key modifiers.  These
       *     property names must match those defined in
       *     hterm.Keyboard.KeyPattern.modifiers.
       * @return {boolean}
       */
      matchKeyDown(keyDown: hterm.Keyboard.KeyDown): boolean

      /**
       * Return true if the given hterm.Keyboard.KeyPattern is exactly the same as
       * this one.
       *
       * @param {!hterm.Keyboard.KeyPattern} keyPattern
       * @return {boolean}
       */
      matchKeyPattern(keyPattern: hterm.Keyboard.KeyPattern): boolean
    }
  }

  class Options {
    /**
     * Constructor for the hterm.Options class, optionally acting as a copy
     * constructor.
     *
     * The defaults are as defined in http://www.vt100.net/docs/vt510-rm/DECSTR
     * except that we enable autowrap (wraparound) by default since that seems to
     * be what xterm does.
     *
     * @param {!hterm.Options=} opt_copy Optional instance to copy.
     * @constructor
     */
    constructor(opt_copy: Partial<Options>)

    wraparound: boolean
    reverseWraparound: boolean
    originMode: boolean
    autoCarriageReturn: boolean
    cursorVisible: boolean
    cursorBlink: boolean
    insertMode: boolean
    reverseVideo: boolean
    bracketedPaste: boolean
  }

  class Parser {
    /**
     * @type {string} The source string.
     */
    source: string

    /**
     * @type {number} The current position.
     */
    pos: number

    /**
     * @type {?string} The character at the current position.
     */
    ch?: string

    /**
     * @param {string} message
     * @return {!Error}
     */
    error(message: string): Error

    /** @return {boolean} */
    isComplete(): boolean

    /**
     * @param {string} source
     * @param {number=} opt_pos
     */
    reset(source: string, opt_pos?: number): void

    /**
     * Parse a key sequence.
     *
     * A key sequence is zero or more of the key modifiers defined in
     * hterm.Parser.identifiers.modifierKeys followed by a key code.  Key
     * codes can be an integer or an identifier from
     * hterm.Parser.identifiers.keyCodes.  Modifiers and keyCodes should be joined
     * by the dash character.
     *
     * An asterisk "*" can be used to indicate that the unspecified modifiers
     * are optional.
     *
     * For example:
     *   A: Matches only an unmodified "A" character.
     *   65: Same as above.
     *   0x41: Same as above.
     *   Ctrl-A: Matches only Ctrl-A.
     *   Ctrl-65: Same as above.
     *   Ctrl-0x41: Same as above.
     *   Ctrl-Shift-A: Matches only Ctrl-Shift-A.
     *   Ctrl-*-A: Matches Ctrl-A, as well as any other key sequence that includes
     *     at least the Ctrl and A keys.
     *
     * @return {!hterm.Keyboard.KeyDown} An object with shift, ctrl, alt, meta,
     *     keyCode properties.
     */
    parseKeySequence(): hterm.Keyboard.KeyDown

    /** @return {string} */
    parseKeyAction(): string

    /** @return {boolean} */
    peekString(): boolean

    /** @return {boolean} */
    peekIdentifier(): boolean

    /** @return {boolean} */
    peekInteger(): boolean

    /** @return {!Object} */
    parseToken(): {
      type: 'symbol' | 'identifier' | 'string'
      value: string
    } | {
      type: 'integer'
      value: number
    }

    /** @return {string} */
    parseIdentifier(): string

    /** @return {number} */
    parseInteger(): number

    /**
     * Parse a single or double quoted string.
     *
     * The current position should point at the initial quote character.  Single
     * quoted strings will be treated literally, double quoted will process escapes.
     *
     * TODO(rginda): Variable interpolation.
     *
     * @return {string}
     */
    parseString(): string

    /**
     * Parse an escape code from the current position (which should point to
     * the first character AFTER the leading backslash.)
     *
     * @return {string}
     */
    parseEscape(): string

    /**
     * Parse the given pattern starting from the current position.
     *
     * @param {!RegExp} pattern A pattern representing the characters to span.  MUST
     *   include the "global" RegExp flag.
     * @return {string}
     */
    parsePattern(pattern: RegExp): string

    /**
     * Advance the current position.
     *
     * @param {number} count
     */
    advance(count: number): void

    /**
     * @param {string=} opt_expect A list of valid non-whitespace characters to
     *   terminate on.
     * @return {void}
     */
    skipSpace(opt_expect?: string): void
  }

  class PreferenceManager extends lib.PreferenceManager {
    /**
     * PreferenceManager subclass managing global NaSSH preferences.
     *
     * This is currently just an ordered list of known connection profiles.
     *
     * @param {string} profileId
     * @extends {lib.PreferenceManager}
     * @constructor
     */
    constructor(profileId: string)

    /**
     * List all the defined profiles.
     *
     * @param {function(!Array<string>)} callback Called with the list of profiles.
     */
    static listProfiles(callback: (arr: string[]) => void): void
  }

  class PubSub {
    /**
     * Utility class used to add publish/subscribe/unsubscribe functionality to
     * an existing object.
     *
     * @constructor
     */
    constructor()

    /**
     * Add publish, subscribe, and unsubscribe methods to an existing object.
     *
     * No other properties of the object are touched, so there is no need to
     * worry about clashing private properties.
     *
     * @param {!Object} obj The object to add this behavior to.
     */
    static addPublish(obj: object): void

    /**
     * Subscribe to be notified of messages about a subject.
     *
     * @param {string} subject The subject to subscribe to.
     * @param {function(...)} callback The function to invoke for notifications.
     */
    subscribe<T>(subject: string, callback: (value: T) => void): void

    /**
     * Unsubscribe from a subject.
     *
     * @param {string} subject The subject to unsubscribe from.
     * @param {function(...)} callback A callback previously registered via
     *     subscribe().
     */
    unsubscribe<T>(subject: string, callback: (value: T) => void): void

    /**
     * Publish a message about a subject.
     *
     * Subscribers (and the optional final callback) are invoked asynchronously.
     * This method will return before anyone is actually notified.
     *
     * @param {string} subject The subject to publish about.
     * @param {?Object=} e An arbitrary object associated with this notification.
     * @param {function(!Object)=} opt_lastCallback An optional function to call
     *     after all subscribers have been notified.
     */
    publish(subject: string, e?: object, opt_lastCallback?: (value: object) => void): void
  }

  class Screen {
    /**
     * Create a new screen instance.
     *
     * The screen initially has no rows and a maximum column count of 0.
     *
     * @param {number=} columnCount The maximum number of columns for this
     *    screen.  See insertString() and overwriteString() for information about
     *    what happens when too many characters are added too a row.  Defaults to
     *    0 if not provided.
     * @constructor
     */
    constructor(columnCount?: number)

    /**
     * Return the screen size as an hterm.Size object.
     *
     * @return {!hterm.Size} hterm.Size object representing the current number
     *     of rows and columns in this screen.
     */
    getSize(): Size

    /**
     * Return the current number of rows in this screen.
     *
     * @return {number} The number of rows in this screen.
     */
    getHeight(): number

    /**
     * Return the current number of columns in this screen.
     *
     * @return {number} The number of columns in this screen.
     */
    getWidth(): number

    /**
     * Set the maximum number of columns per row.
     *
     * @param {number} count The maximum number of columns per row.
     */
    setColumnCount(count: number): void

    /**
     * Remove the first row from the screen and return it.
     *
     * @return {!Element} The first row in this screen.
     */
    shiftRow(): Element

    /**
     * Remove rows from the top of the screen and return them as an array.
     *
     * @param {number} count The number of rows to remove.
     * @return {!Array<!Element>} The selected rows.
     */
    shiftRows(count: number): Element[]

    /**
     * Insert a row at the top of the screen.
     *
     * @param {!Element} row The row to insert.
     */
    unshiftRow(row: Element): void

    /**
     * Insert rows at the top of the screen.
     *
     * @param {!Array<!Element>} rows The rows to insert.
     */
    unshiftRows(rows: Element[]): void

    /**
     * Remove the last row from the screen and return it.
     *
     * @return {!Element} The last row in this screen.
     */
    popRow(): Element

    /**
     * Remove rows from the bottom of the screen and return them as an array.
     *
     * @param {number} count The number of rows to remove.
     * @return {!Array<!Element>} The selected rows.
     */
    popRows(count: number): Element[]

    /**
     * Insert a row at the bottom of the screen.
     *
     * @param {!Element} row The row to insert.
     */
    pushRow(row: Element): void

    /**
     * Insert rows at the bottom of the screen.
     *
     * @param {!Array<!Element>} rows The rows to insert.
     */
    pushRows(rows: Element[]): void

    /**
     * Insert a row at the specified row of the screen.
     *
     * @param {number} index The index to insert the row.
     * @param {!Element} row The row to insert.
     */
    insertRow(index: number, row: Element): void

    /**
     * Insert rows at the specified row of the screen.
     *
     * @param {number} index The index to insert the rows.
     * @param {!Array<!Element>} rows The rows to insert.
     */
    insertRows(index: number, rows: Element[]): void

    /**
     * Remove a row from the screen and return it.
     *
     * @param {number} index The index of the row to remove.
     * @return {!Element} The selected row.
     */
    removeRow(index: number): Element

    /**
     * Remove rows from the bottom of the screen and return them as an array.
     *
     * @param {number} index The index to start removing rows.
     * @param {number} count The number of rows to remove.
     * @return {!Array<!Element>} The selected rows.
     */
    removeRows(index: number, count: number): Element[]

    /**
     * Invalidate the current cursor position.
     *
     * This sets this.cursorPosition to (0, 0) and clears out some internal
     * data.
     *
     * Attempting to insert or overwrite text while the cursor position is invalid
     * will raise an obscure exception.
     */
    invalidateCursorPosition(): void

    /**
     * Clear the contents of the cursor row.
     */
    clearCursorRow(): void

    /**
     * Mark the current row as having overflowed to the next line.
     *
     * The line overflow state is used when converting a range of rows into text.
     * It makes it possible to recombine two or more overflow terminal rows into
     * a single line.
     *
     * This is distinct from the cursor being in the overflow state.  Cursor
     * overflow indicates that printing at the cursor position will commit a
     * line overflow, unless it is preceded by a repositioning of the cursor
     * to a non-overflow state.
     */
    commitLineOverflow(): void

    /**
     * Relocate the cursor to a give row and column.
     *
     * @param {number} row The zero based row.
     * @param {number} column The zero based column.
     */
    setCursorPosition(row: number, column: number): void

    /**
     * Set the provided selection object to be a caret selection at the current
     * cursor position.
     *
     * @param {!Selection} selection
     */
    syncSelectionCaret(selection: Selection): void

    /**
     * Ensure that text is clipped and the cursor is clamped to the column count.
     */
    maybeClipCurrentRow(): void

    /**
     * Insert a string at the current character position using the current
     * text attributes.
     *
     * You must call maybeClipCurrentRow() after in order to clip overflowed
     * text and clamp the cursor.
     *
     * It is also up to the caller to properly maintain the line overflow state
     * using hterm.Screen..commitLineOverflow().
     *
     * @param {string} str The string to insert.
     * @param {number=} wcwidth The cached lib.wc.strWidth value for |str|.  Will be
     *     calculated on demand if need be.  Passing in a cached value helps speed
     *     up processing as this is a hot codepath.
     */
    insertString(str: string, wcwidth?: number): void

    /**
     * Overwrite the text at the current cursor position.
     *
     * You must call maybeClipCurrentRow() after in order to clip overflowed
     * text and clamp the cursor.
     *
     * It is also up to the caller to properly maintain the line overflow state
     * using hterm.Screen..commitLineOverflow().
     *
     * @param {string} str The source string for overwriting existing content.
     * @param {number=} wcwidth The cached lib.wc.strWidth value for |str|.  Will be
     *     calculated on demand if need be.  Passing in a cached value helps speed
     *     up processing as this is a hot codepath.
     */
    overwriteString(str: string, wcwidth?: number): void

    /**
     * Forward-delete one or more characters at the current cursor position.
     *
     * Text to the right of the deleted characters is shifted left.  Only affects
     * characters on the same row as the cursor.
     *
     * @param {number} count The column width of characters to delete.  This is
     *     clamped to the column width minus the cursor column.
     * @return {number} The column width of the characters actually deleted.
     */
    deleteChars(count: number): number

    /**
     * Expands selection to surrounding string using the user's settings.
     *
     * @param {?Selection} selection Selection to expand.
     */
    expandSelection(selection: Selection): void

    /**
     * Expands selection to surrounding URL using a set of fixed match settings.
     *
     * @param {?Selection} selection Selection to expand.
     */
    expandSelectionForUrl(selection: Selection): void

    /**
     * Save the current cursor state to the corresponding screens.
     *
     * @param {!hterm.VT} vt The VT object to read graphic codeset details from.
     */
    saveCursorAndState(vt: hterm.VT): void

    /**
     * Restore the saved cursor state in the corresponding screens.
     *
     * @param {!hterm.VT} vt The VT object to write graphic codeset details to.
     */
    restoreCursorAndState(vt: hterm.VT): void
  }

  class Terminal {
    /**
     * Constructor for the Terminal class.
     *
     * A Terminal pulls together the hterm.ScrollPort, hterm.Screen and hterm.VT100
     * classes to provide the complete terminal functionality.
     *
     * There are a number of lower-level Terminal methods that can be called
     * directly to manipulate the cursor, text, scroll region, and other terminal
     * attributes.  However, the primary method is interpret(), which parses VT
     * escape sequences and invokes the appropriate Terminal methods.
     *
     * This class was heavily influenced by Cory Maccarrone's Framebuffer class.
     *
     * TODO(rginda): Eventually we're going to need to support characters which are
     * displayed twice as wide as standard latin characters.  This is to support
     * CJK (and possibly other character sets).
     *
     * @param {?string=} profileId Optional preference profile name.  If not
     *     provided or null, defaults to 'default'.
     * @constructor
     * @implements {hterm.RowProvider}
     */
    constructor(profileId?: string)

    // Keep track of whether default tab stops have been erased; after a TBC
    // clears all tab stops, defaults aren't restored on resize until a reset.
    defaultTabStops: boolean

    // The context menu object.
    contextMenu: hterm.ContextMenu

    // The VT escape sequence interpreter.
    vt: hterm.VT

    // The keyboard handler.
    keyboard: hterm.Keyboard

    // General IO interface that can be given to third parties without exposing
    // the entire terminal object.
    io: hterm.Terminal.IO

    // True if mouse-click-drag should scroll the terminal.
    enableMouseDragScroll: boolean

    // Whether to use the default window copy behavior.
    useDefaultWindowCopy: boolean

    // Whether we allow images to be shown.
    allowImagesInline: boolean

    /**
     * Clients should override this to be notified when the terminal is ready
     * for use.
     *
     * The terminal initialization is asynchronous, and shouldn't be used before
     * this method is called.
     */
    onTerminalReady: () => void

    /**
     * Default tab with of 8 to match xterm.
     */
    tabWidth: number

    screenSize: hterm.Size

    /**
     * Select a preference profile.
     *
     * This will load the terminal preferences for the given profile name and
     * associate subsequent preference changes with the new preference profile.
     *
     * @param {string} profileId The name of the preference profile.  Forward slash
     *     characters will be removed from the name.
     * @param {function()=} opt_callback Optional callback to invoke when the
     *     profile transition is complete.
     */
    setProfile(profileId: string, opt_callback: () => void): void

    /**
     * Returns the preferences manager used for configuring this terminal.
     *
     * @return {!hterm.PreferenceManager}
     */
    getPrefs(): hterm.PreferenceManager

    /**
     * Enable or disable bracketed paste mode.
     *
     * @param {boolean} state The value to set.
     */
    setBracketedPaste(state: boolean): void

    /**
     * Set the color for the cursor.
     *
     * If you want this setting to persist, set it through prefs_, rather than
     * with this method.
     *
     * @param {string=} color The color to set.  If not defined, we reset to the
     *     saved user preference.
     */
    setCursorColor(color: string): void

    /**
     * Return the current cursor color as a string.
     *
     * @return {string}
     */
    getCursorColor(): string

    /**
     * Enable or disable mouse based text selection in the terminal.
     *
     * @param {boolean} state The value to set.
     */
    setSelectionEnabled(state: boolean): void

    /**
     * Set the background color.
     *
     * If you want this setting to persist, set it through prefs_, rather than
     * with this method.
     *
     * @param {string=} color The color to set.  If not defined, we reset to the
     *     saved user preference.
     */
    setBackgroundColor(color: string): void

    /**
     * Return the current terminal background color.
     *
     * Intended for use by other classes, so we don't have to expose the entire
     * prefs_ object.
     *
     * @return {string}
     */
    getBackgroundColor(): string

    /**
     * Set the foreground color.
     *
     * If you want this setting to persist, set it through prefs_, rather than
     * with this method.
     *
     * @param {string=} color The color to set.  If not defined, we reset to the
     *     saved user preference.
     */
    setForegroundColor(color: string): void

    /**
     * Return the current terminal foreground color.
     *
     * Intended for use by other classes, so we don't have to expose the entire
     * prefs_ object.
     *
     * @return {string}
     */
    getForegroundColor(): string

    /**
     * Create a new instance of a terminal command and run it with a given
     * argument string.
     *
     * @param {!Function} commandClass The constructor for a terminal command.
     * @param {string} commandName The command to run for this terminal.
     * @param {!Array<string>} args The arguments to pass to the command.
     */
    runCommandClass<T>(commandClass: new () => T, commandName: string, args: string[]): void

    /**
     * Returns true if the current screen is the primary screen, false otherwise.
     *
     * @return {boolean}
     */
    isPrimaryScreen(): boolean

    /**
     * Install the keyboard handler for this terminal.
     *
     * This will prevent the browser from seeing any keystrokes sent to the
     * terminal.
     */
    installKeyboard(): void

    /**
     * Uninstall the keyboard handler for this terminal.
     */
    uninstallKeyboard(): void

    /**
     * Set a CSS variable.
     *
     * Normally this is used to set variables in the hterm namespace.
     *
     * @param {string} name The variable to set.
     * @param {string|number} value The value to assign to the variable.
     * @param {string=} opt_prefix The variable namespace/prefix to use.
     */
    setCssVar(name: string, value: string | number, opt_prefix?: string): void

    /**
     * Get a CSS variable.
     *
     * Normally this is used to get variables in the hterm namespace.
     *
     * @param {string} name The variable to read.
     * @param {string=} opt_prefix The variable namespace/prefix to use.
     * @return {string} The current setting for this variable.
     */
    getCssVar(name: string, opt_prefix?: string): string

    /**
     * Set the font size for this terminal.
     *
     * Call setFontSize(0) to reset to the default font size.
     *
     * This function does not modify the font-size preference.
     *
     * @param {number} px The desired font size, in pixels.
     */
    setFontSize(px: number): void

    /**
     * Get the current font size.
     *
     * @return {number}
     */
    getFontSize(): number

    /**
     * Get the current font family.
     *
     * @return {string}
     */
    getFontFamily(): string

    /**
     * Set the CSS "font-family" for this terminal.
     */
    syncFontFamily(): void

    /**
     * Set this.mousePasteButton based on the mouse-paste-button pref,
     * autodetecting if necessary.
     */
    syncMousePasteButton(): void

    /**
     * Enable or disable bold based on the enable-bold pref, autodetecting if
     * necessary.
     */
    syncBoldSafeState(): void

    /**
     * Control text blinking behavior.
     *
     * @param {boolean=} state Whether to enable support for blinking text.
     */
    setTextBlink(state: boolean): void

    /**
     * Set the mouse cursor style based on the current terminal mode.
     */
    syncMouseStyle(): void

    /**
     * Return a copy of the current cursor position.
     *
     * @return {!hterm.RowCol} The RowCol object representing the current position.
     */
    saveCursor(): hterm.RowCol

    /**
     * Return the current text attributes.
     *
     * @return {!hterm.TextAttributes}
     */
    getTextAttributes(): hterm.TextAttributes

    /**
     * Set the text attributes.
     *
     * @param {!hterm.TextAttributes} textAttributes The attributes to set.
     */
    setTextAttributes(textAttributes: hterm.TextAttributes): void

    /**
     * Return the current browser zoom factor applied to the terminal.
     *
     * @return {number} The current browser zoom factor.
     */
    getZoomFactor(): number

    /**
     * Change the title of this terminal's window.
     *
     * @param {string} title The title to set.
     */
    setWindowTitle(title: string): void

    /**
     * Restore a previously saved cursor position.
     *
     * @param {!hterm.RowCol} cursor The position to restore.
     */
    restoreCursor(cursor: hterm.RowCol): void

    /**
     * Clear the cursor's overflow flag.
     */
    clearCursorOverflow(): void

    /**
     * Save the current cursor state to the corresponding screens.
     *
     * See the hterm.Screen.CursorState class for more details.
     *
     * @param {boolean=} both If true, update both screens, else only update the
     *     current screen.
     */
    saveCursorAndState(both: boolean): void

    /**
     * Restore the saved cursor state in the corresponding screens.
     *
     * See the hterm.Screen.CursorState class for more details.
     *
     * @param {boolean=} both If true, update both screens, else only update the
     *     current screen.
     */
    restoreCursorAndState(both: boolean): void

    /**
     * Sets the cursor shape
     *
     * @param {string} shape The shape to set.
     */
    setCursorShape(shape: string): void

    /**
     * Get the cursor shape
     *
     * @return {string}
     */
    getCursorShape(): string

    /**
     * Set the width of the terminal, resizing the UI to match.
     *
     * @param {?number} columnCount
     */
    setWidth(columnCount: number): void

    /**
     * Set the height of the terminal, resizing the UI to match.
     *
     * @param {?number} rowCount The height in rows.
     */
    setHeight(rowCount?: number): void

    /**
     * Scroll the terminal to the top of the scrollback buffer.
     */
    scrollHome(): void

    /**
     * Scroll the terminal to the end.
     */
    scrollEnd(): void

    /**
     * Scroll the terminal one page up (minus one line) relative to the current
     * position.
     */
    scrollPageUp(): void

    /**
     * Scroll the terminal one page down (minus one line) relative to the current
     * position.
     */
    scrollPageDown(): void

    /**
     * Scroll the terminal one line up relative to the current position.
     */
    scrollLineUp(): void

    /**
     * Scroll the terminal one line down relative to the current position.
     */
    scrollLineDown(): void

    /**
     * Clear primary screen, secondary screen, and the scrollback buffer.
     */
    wipeContents(): void

    /**
     * Clear scrollback buffer.
     */
    clearScrollback(): void

    /**
     * Full terminal reset.
     *
     * Perform a full reset to the default values listed in
     * https://vt100.net/docs/vt510-rm/RIS.html
     */
    reset(): void

    /**
     * Soft terminal reset.
     *
     * Perform a soft reset to the default values listed in
     * http://www.vt100.net/docs/vt510-rm/DECSTR#T5-9
     */
    softReset(): void

    /**
     * Move the cursor forward to the next tab stop, or to the last column
     * if no more tab stops are set.
     */
    forwardTabStop(): void

    /**
     * Move the cursor backward to the previous tab stop, or to the first column
     * if no previous tab stops are set.
     */
    backwardTabStop(): void

    /**
     * Set a tab stop at the given column.
     *
     * @param {number} column Zero based column.
     */
    setTabStop(column: number): void

    /**
     * Clear the tab stop at the current cursor position.
     *
     * No effect if there is no tab stop at the current cursor position.
     */
    clearTabStopAtCursor(): void

    /**
     * Clear all tab stops.
     */
    clearAllTabStops(): void

    /**
     * Set up the default tab stops, starting from a given column.
     *
     * This sets a tabstop every (column % this.tabWidth) column, starting
     * from the specified column, or 0 if no column is provided.  It also flags
     * future resizes to set them up.
     *
     * This does not clear the existing tab stops first, use clearAllTabStops
     * for that.
     *
     * @param {number=} opt_start Optional starting zero based starting column,
     *     useful for filling out missing tab stops when the terminal is resized.
     */
    setDefaultTabStops(opt_start?: number): void

    /**
     * Interpret a sequence of characters.
     *
     * Incomplete escape sequences are buffered until the next call.
     *
     * @param {string} str Sequence of characters to interpret or pass through.
     */
    interpret(str: string): void

    /**
     * Take over the given DIV for use as the terminal display.
     *
     * @param {!Element} div The div to use as the terminal display.
     */
    decorate(div: Element): void

    /**
     * Return the HTML document that contains the terminal DOM nodes.
     *
     * @return {!Document}
     */
    getDocument(): Document

    /**
     * Focus the terminal.
     */
    focus(): void

    /**
     * Unfocus the terminal.
     */
    blur(): void

    /**
     * Return the HTML Element for a given row index.
     *
     * This is a method from the RowProvider interface.  The ScrollPort uses
     * it to fetch rows on demand as they are scrolled into view.
     *
     * TODO(rginda): Consider saving scrollback rows as (HTML source, text content)
     * pairs to conserve memory.
     *
     * @param {number} index The zero-based row index, measured relative to the
     *     start of the scrollback buffer.  On-screen rows will always have the
     *     largest indices.
     * @return {!Element} The 'x-row' element containing for the requested row.
     * @override
     */
    getRowNode(index: number): Element

    /**
     * Return the text content for a given range of rows.
     *
     * This is a method from the RowProvider interface.  The ScrollPort uses
     * it to fetch text content on demand when the user attempts to copy their
     * selection to the clipboard.
     *
     * @param {number} start The zero-based row index to start from, measured
     *     relative to the start of the scrollback buffer.  On-screen rows will
     *     always have the largest indices.
     * @param {number} end The zero-based row index to end on, measured
     *     relative to the start of the scrollback buffer.
     * @return {string} A single string containing the text value of the range of
     *     rows.  Lines will be newline delimited, with no trailing newline.
     */
    getRowsText(start: number, end: number): string

    /**
     * Return the text content for a given row.
     *
     * This is a method from the RowProvider interface.  The ScrollPort uses
     * it to fetch text content on demand when the user attempts to copy their
     * selection to the clipboard.
     *
     * @param {number} index The zero-based row index to return, measured
     *     relative to the start of the scrollback buffer.  On-screen rows will
     *     always have the largest indices.
     * @return {string} A string containing the text value of the selected row.
     */
    getRowText(index: number): string

    /**
     * Return the total number of rows in the addressable screen and in the
     * scrollback buffer of this terminal.
     *
     * This is a method from the RowProvider interface.  The ScrollPort uses
     * it to compute the size of the scrollbar.
     *
     * @return {number} The number of rows in this terminal.
     * @override
     */
    getRowCount(): void

    /**
     * Print a string to the terminal.
     *
     * This respects the current insert and wraparound modes.  It will add new lines
     * to the end of the terminal, scrolling off the top into the scrollback buffer
     * if necessary.
     *
     * The string is *not* parsed for escape codes.  Use the interpret() method if
     * that's what you're after.
     *
     * @param {string} str The string to print.
     */
    print(str: string): void

    /**
     * Set the VT scroll region.
     *
     * This also resets the cursor position to the absolute (0, 0) position, since
     * that's what xterm appears to do.
     *
     * Setting the scroll region to the full height of the terminal will clear
     * the scroll region.  This is *NOT* what most terminals do.  We're explicitly
     * going "off-spec" here because it makes `screen` and `tmux` overflow into the
     * local scrollback buffer, which means the scrollbars and shift-pgup/pgdn
     * continue to work as most users would expect.
     *
     * @param {?number} scrollTop The zero-based top of the scroll region.
     * @param {?number} scrollBottom The zero-based bottom of the scroll region,
     *     inclusive.
     */
    setVTScrollRegion(scrollTop: number, scrollBottom: number): void

    /**
     * Return the top row index according to the VT.
     *
     * This will return 0 unless the terminal has been told to restrict scrolling
     * to some lower row.  It is used for some VT cursor positioning and scrolling
     * commands.
     *
     * @return {number} The topmost row in the terminal's scroll region.
     */
    getVTScrollTop(): void

    /**
     * Return the bottom row index according to the VT.
     *
     * This will return the height of the terminal unless the it has been told to
     * restrict scrolling to some higher row.  It is used for some VT cursor
     * positioning and scrolling commands.
     *
     * @return {number} The bottom most row in the terminal's scroll region.
     */
    getVTScrollBottom(): void

    /**
     * Process a '\n' character.
     *
     * If the cursor is on the final row of the terminal this will append a new
     * blank row to the screen and scroll the topmost row into the scrollback
     * buffer.
     *
     * Otherwise, this moves the cursor to column zero of the next row.
     *
     * @param {boolean=} dueToOverflow Whether the newline is due to wraparound of
     *     the terminal.
     */
    newLine(dueToOverflow?: boolean): void

    /**
     * Like newLine(), except maintain the cursor column.
     */
    lineFeed(): void

    /**
     * If autoCarriageReturn is set then newLine(), else lineFeed().
     */
    formFeed(): void

    /**
     * Move the cursor up one row, possibly inserting a blank line.
     *
     * The cursor column is not changed.
     */
    reverseLineFeed(): void

    /**
     * Replace all characters to the left of the current cursor with the space
     * character.
     *
     * TODO(rginda): This should probably *remove* the characters (not just replace
     * with a space) if there are no characters at or beyond the current cursor
     * position.
     */
    eraseToLeft(): void

    /**
     * Erase a given number of characters to the right of the cursor.
     *
     * The cursor position is unchanged.
     *
     * If the current background color is not the default background color this
     * will insert spaces rather than delete.  This is unfortunate because the
     * trailing space will affect text selection, but it's difficult to come up
     * with a way to style empty space that wouldn't trip up the hterm.Screen
     * code.
     *
     * eraseToRight is ignored in the presence of a cursor overflow.  This deviates
     * from xterm, but agrees with gnome-terminal and konsole, xfce4-terminal.  See
     * crbug.com/232390 for details.
     *
     * @param {number=} opt_count The number of characters to erase.
     */
    eraseToRight(opt_count?: number): void

    /**
     * Erase the current line.
     *
     * The cursor position is unchanged.
     */
    eraseLine(): void

    /**
     * Erase all characters from the start of the screen to the current cursor
     * position, regardless of scroll region.
     *
     * The cursor position is unchanged.
     */
    eraseAbove(): void

    /**
     * Erase all characters from the current cursor position to the end of the
     * screen, regardless of scroll region.
     *
     * The cursor position is unchanged.
     */
    eraseBelow(): void

    /**
     * Fill the terminal with a given character.
     *
     * This methods does not respect the VT scroll region.
     *
     * @param {string} ch The character to use for the fill.
     */
    fill(ch: string): void

    /**
     * Erase the entire display and leave the cursor at (0, 0).
     *
     * This does not respect the scroll region.
     *
     * @param {!hterm.Screen=} opt_screen Optional screen to operate on.  Defaults
     *     to the current screen.
     */
    clearHome(opt_screen?: hterm.Screen): void

    /**
     * Erase the entire display without changing the cursor position.
     *
     * The cursor position is unchanged.  This does not respect the scroll
     * region.
     *
     * @param {!hterm.Screen=} opt_screen Optional screen to operate on.  Defaults
     *     to the current screen.
     */
    clear(opt_screen?: hterm.Screen): void

    /**
     * VT command to insert lines at the current cursor row.
     *
     * This respects the current scroll region.  Rows pushed off the bottom are
     * lost (they won't show up in the scrollback buffer).
     *
     * @param {number} count The number of lines to insert.
     */
    insertLines(count: number): void

    /**
     * VT command to delete lines at the current cursor row.
     *
     * New rows are added to the bottom of scroll region to take their place.  New
     * rows are strictly there to take up space and have no content or style.
     *
     * @param {number} count The number of lines to delete.
     */
    deleteLines(count: number): void

    /**
     * Inserts the given number of spaces at the current cursor position.
     *
     * The cursor position is not changed.
     *
     * @param {number} count The number of spaces to insert.
     */
    insertSpace(count: number): void

    /**
     * Forward-delete the specified number of characters starting at the cursor
     * position.
     *
     * @param {number} count The number of characters to delete.
     */
    deleteChars(count: number): void

    /**
     * Shift rows in the scroll region upwards by a given number of lines.
     *
     * New rows are inserted at the bottom of the scroll region to fill the
     * vacated rows.  The new rows not filled out with the current text attributes.
     *
     * This function does not affect the scrollback rows at all.  Rows shifted
     * off the top are lost.
     *
     * The cursor position is not altered.
     *
     * @param {number} count The number of rows to scroll.
     */
    vtScrollUp(count: number): void

    /**
     * Shift rows below the cursor down by a given number of lines.
     *
     * This function respects the current scroll region.
     *
     * New rows are inserted at the top of the scroll region to fill the
     * vacated rows.  The new rows not filled out with the current text attributes.
     *
     * This function does not affect the scrollback rows at all.  Rows shifted
     * off the bottom are lost.
     *
     * @param {number} count The number of rows to scroll.
     */
    vtScrollDown(count: number): void

    /**
     * Enable accessibility-friendly features that have a performance impact.
     *
     * This will generate additional DOM nodes in an aria-live region that will
     * cause Assitive Technology to announce the output of the terminal. It also
     * enables other features that aid assistive technology. All the features gated
     * behind this flag have a performance impact on the terminal which is why they
     * are made optional.
     *
     * @param {boolean} enabled Whether to enable accessibility-friendly features.
     */
    setAccessibilityEnabled(enabled: boolean): void

    /**
     * Set the cursor position.
     *
     * The cursor row is relative to the scroll region if the terminal has
     * 'origin mode' enabled, or relative to the addressable screen otherwise.
     *
     * @param {number} row The new zero-based cursor row.
     * @param {number} column The new zero-based cursor column.
     */
    setCursorPosition(row: number, column: number): void

    /**
     * Move the cursor relative to its current position.
     *
     * @param {number} row
     * @param {number} column
     */
    setRelativeCursorPosition(row: number, column: number): void

    /**
     * Move the cursor to the specified position.
     *
     * @param {number} row
     * @param {number} column
     */
    setAbsoluteCursorPosition(row: number, column: number): void

    /**
     * Set the cursor column.
     *
     * @param {number} column The new zero-based cursor column.
     */
    setCursorColumn(column: number): void

    /**
     * Return the cursor column.
     *
     * @return {number} The zero-based cursor column.
     */
    getCursorColumn(): number

    /**
     * Set the cursor row.
     *
     * The cursor row is relative to the scroll region if the terminal has
     * 'origin mode' enabled, or relative to the addressable screen otherwise.
     *
     * @param {number} row The new cursor row.
     */
    setAbsoluteCursorRow(row: number): void

    /**
     * Return the cursor row.
     *
     * @return {number} The zero-based cursor row.
     */
    getCursorRow(): number

    /**
     * Move the cursor up a specified number of rows.
     *
     * @param {number} count The number of rows to move the cursor.
     */
    cursorUp(count: number): void

    /**
     * Move the cursor down a specified number of rows.
     *
     * @param {number} count The number of rows to move the cursor.
     */
    cursorDown(count: number): void

    /**
     * Move the cursor left a specified number of columns.
     *
     * If reverse wraparound mode is enabled and the previous row wrapped into
     * the current row then we back up through the wraparound as well.
     *
     * @param {number} count The number of columns to move the cursor.
     */
    cursorLeft(count: number): void

    /**
     * Move the cursor right a specified number of columns.
     *
     * @param {number} count The number of columns to move the cursor.
     */
    cursorRight(count: number): void

    /**
     * Reverse the foreground and background colors of the terminal.
     *
     * This only affects text that was drawn with no attributes.
     *
     * TODO(rginda): Test xterm to see if reverse is respected for text that has
     * been drawn with attributes that happen to coincide with the default
     * 'no-attribute' colors.  My guess is probably not.
     *
     * @param {boolean} state The state to set.
     */
    setReverseVideo(state: boolean): void

    /**
     * Ring the terminal bell.
     *
     * This will not play the bell audio more than once per second.
     */
    ringBell(): void

    /**
     * Set the origin mode bit.
     *
     * If origin mode is on, certain VT cursor and scrolling commands measure their
     * row parameter relative to the VT scroll region.  Otherwise, row 0 corresponds
     * to the top of the addressable screen.
     *
     * Defaults to off.
     *
     * @param {boolean} state True to set origin mode, false to unset.
     */
    setOriginMode(state: boolean): void

    /**
     * Set the insert mode bit.
     *
     * If insert mode is on, existing text beyond the cursor position will be
     * shifted right to make room for new text.  Otherwise, new text overwrites
     * any existing text.
     *
     * Defaults to off.
     *
     * @param {boolean} state True to set insert mode, false to unset.
     */
    setInsertMode(state: boolean): void

    /**
     * Set the auto carriage return bit.
     *
     * If auto carriage return is on then a formfeed character is interpreted
     * as a newline, otherwise it's the same as a linefeed.  The difference boils
     * down to whether or not the cursor column is reset.
     *
     * @param {boolean} state The state to set.
     */
    setAutoCarriageReturn(state: boolean): void

    /**
     * Set the wraparound mode bit.
     *
     * If wraparound mode is on, certain VT commands will allow the cursor to wrap
     * to the start of the following row.  Otherwise, the cursor is clamped to the
     * end of the screen and attempts to write past it are ignored.
     *
     * Defaults to on.
     *
     * @param {boolean} state True to set wraparound mode, false to unset.
     */
    setWraparound(state: boolean): void

    /**
     * Set the reverse-wraparound mode bit.
     *
     * If wraparound mode is off, certain VT commands will allow the cursor to wrap
     * to the end of the previous row.  Otherwise, the cursor is clamped to column
     * 0.
     *
     * Defaults to off.
     *
     * @param {boolean} state True to set reverse-wraparound mode, false to unset.
     */
    setReverseWraparound(state: boolean): void

    /**
     * Selects between the primary and alternate screens.
     *
     * If alternate mode is on, the alternate screen is active.  Otherwise the
     * primary screen is active.
     *
     * Swapping screens has no effect on the scrollback buffer.
     *
     * Each screen maintains its own cursor position.
     *
     * Defaults to off.
     *
     * @param {boolean} state True to set alternate mode, false to unset.
     */
    setAlternateMode(state: boolean): void

    /**
     * Set the cursor-blink mode bit.
     *
     * If cursor-blink is on, the cursor will blink when it is visible.  Otherwise
     * a visible cursor does not blink.
     *
     * You should make sure to turn blinking off if you're going to dispose of a
     * terminal, otherwise you'll leak a timeout.
     *
     * Defaults to on.
     *
     * @param {boolean} state True to set cursor-blink mode, false to unset.
     */
    setCursorBlink(state: boolean): void

    /**
     * Set the cursor-visible mode bit.
     *
     * If cursor-visible is on, the cursor will be visible.  Otherwise it will not.
     *
     * Defaults to on.
     *
     * @param {boolean} state True to set cursor-visible mode, false to unset.
     */
    setCursorVisible(state: boolean): void

    /**
     * Show the terminal overlay for a given amount of time.
     *
     * The terminal overlay appears in inverse video in a large font, centered
     * over the terminal.  You should probably keep the overlay message brief,
     * since it's in a large font and you probably aren't going to check the size
     * of the terminal first.
     *
     * @param {string} msg The text (not HTML) message to display in the overlay.
     * @param {number=} opt_timeout The amount of time to wait before fading out
     *     the overlay.  Defaults to 1.5 seconds.  Pass null to have the overlay
     *     stay up forever (or until the next overlay).
     */
    showOverlay(msg: string, opt_timeout?: number): void

    /**
     * Hide the terminal overlay immediately.
     *
     * Useful when we show an overlay for an event with an unknown end time.
     */
    hideOverlay(): void

    /**
     * Paste from the system clipboard to the terminal.
     *
     * @return {boolean}
     */
    paste(): boolean

    /**
     * Copy a string to the system clipboard.
     *
     * Note: If there is a selected range in the terminal, it'll be cleared.
     *
     * @param {string} str The string to copy.
     */
    copyStringToClipboard(str: string): void

    /**
     * Display an image.
     *
     * Either URI or buffer or blob fields must be specified.
     *
     * @param {{
     *     name: (string|undefined),
     *     size: (string|number|undefined),
     *     preserveAspectRation: (boolean|undefined),
     *     inline: (boolean|undefined),
     *     width: (string|number|undefined),
     *     height: (string|number|undefined),
     *     align: (string|undefined),
     *     url: (string|undefined),
     *     buffer: (!ArrayBuffer|undefined),
     *     blob: (!Blob|undefined),
     *     type: (string|undefined),
     * }} options The image to display.
     *   name A human readable string for the image
     *   size The size (in bytes).
     *   preserveAspectRatio Whether to preserve aspect.
     *   inline Whether to display the image inline.
     *   width The width of the image.
     *   height The height of the image.
     *   align Direction to align the image.
     *   uri The source URI for the image.
     *   buffer The ArrayBuffer image data.
     *   blob The Blob image data.
     *   type The MIME type of the image data.
     * @param {function()=} onLoad Callback when loading finishes.
     * @param {function(!Event)=} onError Callback when loading fails.
     */
    displayImage(options: {
      name?: string,
      size?: string | number,
      preserveAspectRation?: boolean,
      inline?: boolean,
      width?: string | number,
      height?: string | number,
      align?: string,
      url?: string,
      buffer?: ArrayBuffer,
      blob?: Blob,
      type?: string,
    }, onLoad: () => void, onError: (e: Event) => void): void

    /**
     * Returns the selected text, or null if no text is selected.
     *
     * @return {string|null}
     */
    getSelectionText(): string | null

    /**
     * Copy the current selection to the system clipboard, then clear it after a
     * short delay.
     */
    copySelectionToClipboard(): void

    /**
     * Show overlay with current terminal size.
     */
    overlaySize(): void

    /**
     * Invoked by hterm.Terminal.Keyboard when a VT keystroke is detected.
     *
     * @param {string} string The VT string representing the keystroke, in UTF-16.
     */
    onVTKeystroke(string: string): void

    /**
     * Manage the automatic mouse hiding behavior while typing.
     *
     * @param {?boolean=} v Whether to enable automatic hiding.
     */
    setAutomaticMouseHiding(v: boolean): void

    /**
     * Clients should override this if they care to know about mouse events.
     *
     * The event parameter will be a normal DOM mouse click event with additional
     * 'terminalRow' and 'terminalColumn' properties.
     *
     * @param {!MouseEvent} e The mouse event to handle.
     */
    onMouse: (e: MouseEvent) => void

    /**
     * Set the scrollbar-visible mode bit.
     *
     * If scrollbar-visible is on, the vertical scrollbar will be visible.
     * Otherwise it will not.
     *
     * Defaults to on.
     *
     * @param {boolean} state True to set scrollbar-visible mode, false to unset.
     */
    setScrollbarVisible(state: boolean): void

    /**
     * Set the scroll wheel move multiplier.  This will affect how fast the page
     * scrolls on wheel events.
     *
     * Defaults to 1.
     *
     * @param {number} multiplier The multiplier to set.
     */
    setScrollWheelMoveMultipler(multiplier: number): void
  }

  namespace Terminal {
    const cursorShape: {
      BLOCK: 'BLOCK',
      BEAM: 'BEAM',
      UNDERLINE: 'UNDERLINE'
    }

    class IO {
      /**
       * Input/Output interface used by commands to communicate with the terminal.
       *
       * Commands like `nassh` and `crosh` receive an instance of this class as
       * part of their argv object.  This allows them to write to and read from the
       * terminal without exposing them to an entire hterm.Terminal instance.
       *
       * The active command must override the onVTKeystroke() and sendString() methods
       * of this class in order to receive keystrokes and send output to the correct
       * destination.
       *
       * Isolating commands from the terminal provides the following benefits:
       * - Provides a mechanism to save and restore onVTKeystroke and sendString
       *   handlers when invoking subcommands (see the push() and pop() methods).
       * - The isolation makes it easier to make changes in Terminal and supporting
       *   classes without affecting commands.
       * - In The Future commands may run in web workers where they would only be able
       *   to talk to a Terminal instance through an IPC mechanism.
       *
       * @param {!hterm.Terminal} terminal
       * @constructor
       */
      constructor(terminal: hterm.Terminal)

      /**
       * Show the terminal overlay for a given amount of time.
       *
       * The terminal overlay appears in inverse video in a large font, centered
       * over the terminal.  You should probably keep the overlay message brief,
       * since it's in a large font and you probably aren't going to check the size
       * of the terminal first.
       *
       * @param {string} message The text (not HTML) message to display in the
       *     overlay.
       * @param {number=} opt_timeout The amount of time to wait before fading out
       *     the overlay.  Defaults to 1.5 seconds.  Pass null to have the overlay
       *     stay up forever (or until the next overlay).
       */
      showOverlay(message: string, number?: number | null): void

      /**
       * Hide the current overlay immediately.
       *
       * Useful when we show an overlay for an event with an unknown end time.
       */
      hideOverlay(): void

      /**
       * Open an frame in the current terminal window, pointed to the specified
       * url.
       *
       * Eventually we'll probably need size/position/decoration options.
       * The user should also be able to move/resize the frame.
       *
       * @param {string} url The URL to load in the frame.
       * @param {!Object=} opt_options Optional frame options.  Not implemented.
       * @return {!hterm.Frame}
       */
      createFrame(url: string, opt_options?: {}): hterm.Frame

      /**
       * Change the preference profile for the terminal.
       *
       * @param {string} profileName The name of the preference profile to activate.
       */
      setTerminalProfile(profileName: string): void

      /**
       * Create a new hterm.Terminal.IO instance and make it active on the Terminal
       * object associated with this instance.
       *
       * This is used to pass control of the terminal IO off to a subcommand.  The
       * IO.pop() method can be used to restore control when the subcommand completes.
       *
       * @return {!hterm.Terminal.IO} The new foreground IO instance.
       */
      push(): hterm.Terminal.IO

      /**
       * Restore the Terminal's previous IO object.
       *
       * We'll flush out any queued data.
       */
      pop(): void

      /**
       * Flush accumulated data.
       *
       * If we're not the active IO, the connected process might still be writing
       * data to us, but we won't be displaying it.  Flush any buffered data now.
       */
      flush(): void

      /**
       * Called when data needs to be sent to the current command.
       *
       * Clients should override this to receive notification of pending data.
       *
       * @param {string} string The data to send.
       */
      sendString(string: string): void

      /**
       * Called when a terminal keystroke is detected.
       *
       * Clients should override this to receive notification of keystrokes.
       *
       * @param {string} string The VT key sequence.
       */
      onVTKeystroke: (data: string) => void

      /**
       * Called when terminal size is changed.
       *
       * Clients should override this to receive notification of resize.
       *
       * @param {string|number} width The new terminal width.
       * @param {string|number} height The new terminal height.
       */
      onTerminalResize: (width: number, height: number) => void

      /**
       * Write a UTF-8 encoded byte string to the terminal.
       *
       * @param {string|!ArrayBuffer} string The UTF-8 encoded string to print.
       */
      writeUTF8(string: string | ArrayBuffer): void

      /**
       * Write a UTF-8 encoded byte string to the terminal followed by crlf.
       *
       * @param {string} string The UTF-8 encoded string to print.
       */
      writelnUTF8(string: string): void

      /**
       * Write a UTF-16 JavaScript string to the terminal.
       *
       * @param {string} string The string to print.
       */
      print(string: string): void

      /**
       * Write a UTF-16 JavaScript string to the terminal.
       *
       * @param {string} string The string to print.
       */
      writeUTF16(string: string): void

      /**
       * Print a UTF-16 JavaScript string to the terminal followed by a newline.
       *
       * @param {string} string The string to print.
       */
      println(string: string): void

      /**
       * Print a UTF-16 JavaScript string to the terminal followed by a newline.
       *
       * @param {string} string The string to print.
       */
      writelnUTF16(string: string): void
    }
  }

  class TextAttributes {
    /**
     * Constructor for TextAttribute objects.
     *
     * These objects manage a set of text attributes such as foreground/
     * background color, bold, faint, italic, blink, underline, and strikethrough.
     *
     * TextAttribute instances can be used to construct a DOM container implementing
     * the current attributes, or to test an existing DOM container for
     * compatibility with the current attributes.
     *
     * @constructor
     * @param {!Document=} document The parent document to use when creating
     *     new DOM containers.
     */
    constructor(document: Document)

    /**
     * A sentinel constant meaning "whatever the default color is in this context".
     */
    static readonly SRC_DEFAULT: unique symbol
    /**
     * A constant string used to specify that source color is context default.
     */
    static readonly DEFAULT_COLOR: unique symbol

    foregroundSource: typeof TextAttributes.SRC_DEFAULT | string | number
    backgroundSource: typeof TextAttributes.SRC_DEFAULT | string | number
    underlineSource: typeof TextAttributes.SRC_DEFAULT | string | number

    foreground: typeof TextAttributes.DEFAULT_COLOR | string
    background: typeof TextAttributes.DEFAULT_COLOR | string
    underlineColor: typeof TextAttributes.DEFAULT_COLOR | string
    
    bold: boolean
    faint: boolean
    italic: boolean
    blink: boolean
    underline: boolean
    strikethrough: boolean
    inverse: boolean
    invisible: boolean
    wcNode: boolean
    asciiNode: boolean
    tileData?: string
    uri?: string
    uriId?: string

    colorPalette?: string

    enableBold: boolean
    enableBoldAsBright: boolean

    /**
     * The document object which should own the DOM nodes created by this instance.
     *
     * @param {!Document} document The parent document.
     */
    setDocument(document: Document): void

    /**
     * Create a deep copy of this object.
     *
     * @return {!hterm.TextAttributes} A deep copy of this object.
     */
    clone(): this

    /**
     * Reset the current set of attributes.
     *
     * This does not affect the palette.  Use resetColorPalette() for that.
     * It also doesn't affect the tile data, it's not meant to.
     */
    reset(): void

    /**
     * Reset the color palette to the default state.
     */
    resetColorPalette(): void

    /**
     * Reset the color.
     *
     * @param {number|string} index The color index in the palette to reset.
     */
    resetColor(index: number|string): void

    /**
     * Test if the current attributes describe unstyled text.
     *
     * @return {boolean} True if the current attributes describe unstyled text.
     */
    isDefault(): boolean

    /**
     * Create a DOM container (a span or a text node) with a style to match the
     * current set of attributes.
     *
     * This method will create a plain text node if the text is unstyled, or
     * an HTML span if the text is styled.  Due to lack of monospace wide character
     * fonts on certain systems (e.g. Chrome OS), we need to put each wide character
     * in a span of CSS class '.wc-node' which has double column width.
     * Each vt_tiledata tile is also represented by a span with a single
     * character, with CSS classes '.tile' and '.tile_<glyph number>'.
     *
     * @param {string=} opt_textContent Optional text content for the new container.
     * @return {!Node} An HTML span or text nodes styled to match the current
     *     attributes.
     */
    createContainer(opt_textContent?:string): Node

    /**
     * Tests if the provided object (string, span or text node) has the same
     * style as this TextAttributes instance.
     *
     * This indicates that text with these attributes could be inserted directly
     * into the target DOM node.
     *
     * For the purposes of this method, a string is considered a text node.
     *
     * @param {string|!Node} obj The object to test.
     * @return {boolean} True if the provided container has the same style as
     *     this attributes instance.
     */
    matchesContainer(obj: Node|string): boolean

    /**
     * Set default foreground & background colors.
     *
     * @param {?string} foreground The terminal foreground color for use as
     *     inverse text background.
     * @param {?string} background The terminal background color for use as
     *     inverse text foreground.
     */
    setDefaults(foreground: string, background: string): void

    /**
     * Updates foreground and background properties based on current indices and
     * other state.
     */
    syncColors(): void

    /**
     * Static method used to test if the provided objects (strings, spans or
     * text nodes) have the same style.
     *
     * For the purposes of this method, a string is considered a text node.
     *
     * @param {string|!Node} obj1 An object to test.
     * @param {string|!Node} obj2 Another object to test.
     * @return {boolean} True if the containers have the same style.
     */
    static containersMatch(obj1: Node|string, obj2: Node|string): boolean

    /**
     * Static method to test if a given DOM container represents unstyled text.
     *
     * For the purposes of this method, a string is considered a text node.
     *
     * @param {string|!Node} obj An object to test.
     * @return {boolean} True if the object is unstyled.
     */
    static containerIsDefault(obj: string|Node): boolean

    /**
     * Static method to get the column width of a node's textContent.
     *
     * @param {!Node} node The HTML element to get the width of textContent
     *     from.
     * @return {number} The column width of the node's textContent.
     */
    static nodeWidth(node: Node): number

    /**
     * Static method to get the substr of a node's textContent.  The start index
     * and substr width are computed in column width.
     *
     * @param {!Node} node The HTML element to get the substr of textContent
     *     from.
     * @param {number} start The starting offset in column width.
     * @param {number=} width The width to capture in column width.
     * @return {string} The extracted substr of the node's textContent.
     */
    static nodeSubstr(node: Node, start: number, width: Number): string

    /**
     * Static method to get the substring based of a node's textContent.  The
     * start index of end index are computed in column width.
     *
     * @param {!Element} node The HTML element to get the substr of textContent
     *     from.
     * @param {number} start The starting offset in column width.
     * @param {number} end The ending offset in column width.
     * @return {string} The extracted substring of the node's textContent.
     */
    static nodeSubstring(node: Node, start: number, width: Number): string

    /**
     * Static method to split a string into contiguous runs of single-width
     * characters and runs of double-width characters.
     *
     * @param {string} str The string to split.
     * @return {!Array<{str:string, wcNode:boolean, asciiNode:boolean,
     *     wcStrWidth:number}>} An array of objects that contain substrings of str,
     *     where each substring is either a contiguous runs of single-width
     *     characters or a double-width character.  For objects that contain a
     *     double-width character, its wcNode property is set to true.  For objects
     *     that contain only ASCII content, its asciiNode property is set to true.
     */
    static splitWidecharString(str: string): Array<{
      str:string
      wcNode: boolean
      asciiNode: boolean
      wcStrWidth: number
    }>
  }

  class VT {
    /**
     * Constructor for the VT escape sequence interpreter.
     *
     * The interpreter operates on a terminal object capable of performing cursor
     * move operations, painting characters, etc.
     *
     * This interpreter is intended to be compatible with xterm, though it
     * ignores some of the more esoteric escape sequences.
     *
     * Control sequences are documented in hterm/doc/ControlSequences.md.
     *
     * @param {!hterm.Terminal} terminal Terminal to use with the interpreter.
     * @constructor
     */
    constructor(terminal: hterm.Terminal)
    
    /**
     * Reset the VT back to baseline state.
     */
    reset(): void

    /**
     * Interpret a string of characters, displaying the results on the associated
     * terminal object.
     *
     * The buffer will be decoded according to the 'receive-encoding' preference.
     *
     * @param {string} buf The buffer to interpret.
     */
    interpret(buf: string): void

    /**
     * Set the encoding of the terminal.
     *
     * @param {string} encoding The name of the encoding to set.
     */
    setEncoding(encoding: string): void

    /**
     * Dispatch to the function that handles a given CC1, ESC, or CSI or VT52 code.
     *
     * @param {string} type
     * @param {string} code
     * @param {!hterm.VT.ParseState} parseState The current parse state.
     */
    dispatch(type: string, code: string, parseState: hterm.VT.ParseState): void

    /**
     * Set one of the ANSI defined terminal mode bits.
     *
     * Invoked in response to SM/RM.
     *
     * Unexpected and unimplemented values are silently ignored.
     *
     * @param {string} code
     * @param {boolean} state
     */
    setANSIMode(code: string, state: boolean): void

    /**
     * Set or reset one of the DEC Private modes.
     *
     * Invoked in response to DECSET/DECRST.
     *
     * @param {string} code
     * @param {boolean} state
     */
    setDECMode(code: string, state: boolean): void

    /**
     * Function shared by control characters and escape sequences that are
     * ignored.
     */
    ignore(): void
  }

  namespace VT {
    class ParseState {
      /**
       * ParseState constructor.
       *
       * This object tracks the current state of the parse.  It has fields for the
       * current buffer, position in the buffer, and the parse function.
       *
       * @param {function(!hterm.VT.ParseState)=} defaultFunction The default parser
       *     function.
       * @param {string=} opt_buf Optional string to use as the current buffer.
       * @constructor
       */
      constructor(defaultFunction?: (state: hterm.VT.ParseState) => void, opt_buf?: string)

      /**
       * Reset the parser function, buffer, and position.
       *
       * @param {string=} opt_buf Optional string to use as the current buffer.
       */
      reset(opt_buf: string): void

      /**
       * Reset the parser function only.
       */
      resetParseFunction(): void

      /**
       * Reset the buffer and position only.
       *
       * @param {string=} opt_buf Optional new value for buf, defaults to null.
       */
      resetBuf(opt_buf: string): void

      /**
       * Reset the arguments list only.
       *
       * Typically we reset arguments before parsing a sequence that uses them rather
       * than always trying to make sure they're in a good state.  This can lead to
       * confusion during debugging where args from a previous sequence appear to be
       * "sticking around" in other sequences (which in reality don't use args).
       *
       * @param {string=} opt_arg_zero Optional initial value for args[0].
       */
      resetArguments(opt_arg_zero?: string): void

      /**
       * Parse an argument as an integer.
       *
       * This assumes the inputs are already in the proper format.  e.g. This won't
       * handle non-numeric arguments.
       *
       * An "0" argument is treated the same as "" which means the default value will
       * be applied.  This is what most terminal sequences expect.
       *
       * @param {string} argstr The argument to parse directly.
       * @param {number=} defaultValue Default value if argstr is empty.
       * @return {number} The parsed value.
       */
      parseInt(argstr: string, defaultValue?: number): number

      /**
       * Get an argument as an integer.
       *
       * @param {number} argnum The argument number to retrieve.
       * @param {number=} defaultValue Default value if the argument is empty.
       * @return {number} The parsed value.
       */
      iarg(argnum: number, defaultValue?: number): number

      /**
       * Check whether an argument has subarguments.
       *
       * @param {number} argnum The argument number to check.
       * @return {number} Whether the argument has subarguments.
       */
      argHasSubargs(argnum: number): number

      /**
       * Mark an argument as having subarguments.
       *
       * @param {number} argnum The argument number that has subarguments.
       */
      argSetSubargs(argnum: number): void

      /**
       * Advance the parse position.
       *
       * @param {number} count The number of bytes to advance.
       */
      advance(count: number): void

      /**
       * Return the remaining portion of the buffer without affecting the parse
       * position.
       *
       * @return {string} The remaining portion of the buffer.
       */
      peekRemainingBuf(): string

      /**
       * Return the next single character in the buffer without affecting the parse
       * position.
       *
       * @return {string} The next character in the buffer.
       */
      peekChar(): string

      /**
       * Return the next single character in the buffer and advance the parse
       * position one byte.
       *
       * @return {string} The next character in the buffer.
       */
      consumeChar(): string

      /**
       * Return true if the buffer is empty, or the position is past the end.
       *
       * @return {boolean} Whether the buffer is empty, or the position is past the
       *     end.
       */
      isComplete(): boolean
    }
  }

  let defaultStorage: lib.Storage
}
