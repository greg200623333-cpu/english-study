import { useState } from 'react'
import { motion } from 'framer-motion'
import Editor from '@monaco-editor/react'

interface Props {
  onBack: () => void
}

const DOC_SECTIONS = [
  { id: 'intro', label: 'Introduction to C', icon: '📖' },
  { id: 'pointers', label: 'Pointers & Memory', icon: '🔗' },
  { id: 'structs', label: 'Structs & Unions', icon: '🧱' },
  { id: 'io', label: 'File I/O', icon: '📁' },
  { id: 'stdlib', label: 'Standard Library', icon: '📚' },
]

const DOC_CONTENT: Record<string, string> = {
  intro: `/**
 * C Programming Language - Official Technical Reference
 * ISO/IEC 9899:2018 (C17 Standard)
 *
 * INTRODUCTION
 * ============
 * C is a general-purpose programming language that provides low-level
 * access to memory, language constructs that map efficiently to machine
 * instructions, and minimal runtime support.
 *
 * A C program consists of one or more translation units. Each translation
 * unit is a source file after preprocessing. The compiler translates each
 * translation unit independently and the linker combines them.
 *
 * BASIC STRUCTURE
 * ===============
 * Every C program must have exactly one function named main(), which is
 * the designated start of program execution.
 */

#include <stdio.h>   /* Standard I/O: printf, scanf, fopen, etc. */
#include <stdlib.h>  /* General utilities: malloc, free, exit, etc. */
#include <string.h>  /* String handling: strcpy, strlen, memcpy, etc. */

/**
 * main() - Program entry point
 * @argc: Argument count (number of command-line arguments)
 * @argv: Argument vector (array of argument strings)
 *
 * Return: EXIT_SUCCESS (0) on success, EXIT_FAILURE (1) on error.
 *
 * The operating system passes argc and argv to main(). argv[0] is
 * conventionally the program name. argv[argc] is guaranteed to be NULL.
 */
int main(int argc, char *argv[]) {
    /* Declare variables at the beginning of a block (C89 compatibility) */
    int exit_code = EXIT_SUCCESS;

    printf("Hello, World!\\n");

    /*
     * Return value from main() is passed to the host environment.
     * EXIT_SUCCESS and EXIT_FAILURE are defined in <stdlib.h>.
     */
    return exit_code;
}`,

  pointers: `/**
 * POINTERS AND MEMORY MANAGEMENT
 * ================================
 * A pointer is a variable that stores the memory address of another variable.
 * Pointers are fundamental to C and enable dynamic memory allocation,
 * efficient array handling, and building complex data structures.
 *
 * POINTER DECLARATION SYNTAX:
 *   type *pointer_name;
 *
 * The unary & operator yields the address of its operand.
 * The unary * operator (dereference) yields the value at the address.
 */

#include <stdio.h>
#include <stdlib.h>

/**
 * demonstrate_pointers() - Illustrates basic pointer operations
 *
 * Pointer arithmetic: when you add an integer n to a pointer p,
 * the result is p + n * sizeof(*p). This means pointer arithmetic
 * is always in units of the pointed-to type.
 */
void demonstrate_pointers(void) {
    int value = 42;
    int *ptr = &value;   /* ptr holds the address of value */

    printf("Value:   %d\\n", value);   /* Direct access:   42  */
    printf("Address: %p\\n", (void *)ptr);  /* Memory address    */
    printf("Via ptr: %d\\n", *ptr);    /* Dereference:     42  */

    *ptr = 100;  /* Modify value through pointer */
    printf("After:   %d\\n", value);   /* value is now 100     */
}

/**
 * dynamic_array() - Demonstrates heap allocation with malloc/free
 *
 * malloc() allocates size bytes and returns a pointer to the allocated
 * memory. The memory is NOT initialized. Returns NULL on failure.
 *
 * IMPORTANT: Every malloc() must be paired with exactly one free().
 * Failing to free memory causes a memory leak.
 */
int *dynamic_array(size_t n) {
    int *arr = (int *)malloc(n * sizeof(int));
    if (arr == NULL) {
        /* malloc failed — handle gracefully, never dereference NULL */
        fprintf(stderr, "Memory allocation failed\\n");
        return NULL;
    }

    for (size_t i = 0; i < n; i++) {
        arr[i] = (int)(i * i);  /* arr[i] is equivalent to *(arr + i) */
    }

    return arr;  /* Caller is responsible for calling free(arr) */
}`,

  structs: `/**
 * STRUCTURES AND UNIONS
 * ======================
 * A structure (struct) is a user-defined type that groups variables of
 * different types under a single name. Each member has its own storage.
 *
 * A union is similar but all members share the same memory location.
 * The size of a union equals the size of its largest member.
 *
 * STRUCT LAYOUT AND PADDING
 * ==========================
 * The compiler may insert padding bytes between struct members to satisfy
 * alignment requirements. Use offsetof() from <stddef.h> to get the
 * exact byte offset of a member.
 */

#include <stdio.h>
#include <string.h>
#include <stddef.h>

/* Forward declaration — allows self-referential structs */
typedef struct Node Node;

/**
 * struct Node - Singly-linked list node
 * @data:  Integer payload stored in this node
 * @next:  Pointer to the next node, or NULL if this is the last node
 *
 * Self-referential structs must use the struct tag (not typedef) in the
 * member declaration because the typedef is not yet complete at that point.
 */
struct Node {
    int   data;
    Node *next;
};

/**
 * struct Point - 2D coordinate with named initializer example
 * @x: Horizontal coordinate
 * @y: Vertical coordinate
 */
typedef struct {
    double x;
    double y;
} Point;

/**
 * distance() - Compute Euclidean distance between two points
 * @a: First point (passed by value — struct is copied)
 * @b: Second point (passed by value — struct is copied)
 *
 * For large structs, prefer passing by const pointer to avoid copying:
 *   double distance(const Point *a, const Point *b)
 */
double distance(Point a, Point b) {
    double dx = a.x - b.x;
    double dy = a.y - b.y;
    return __builtin_sqrt(dx * dx + dy * dy);
}

/**
 * union Value - Type-punning example (implementation-defined behavior)
 * @i: Interpret the bytes as a signed 32-bit integer
 * @f: Interpret the same bytes as a 32-bit float
 *
 * Only the last-written member is guaranteed to be valid (C17 §6.5.2.3).
 */
typedef union {
    int   i;
    float f;
} Value;`,

  io: `/**
 * FILE INPUT/OUTPUT
 * ==================
 * The C standard library provides buffered I/O through the FILE abstraction.
 * All file operations use a FILE* handle obtained from fopen().
 *
 * OPEN MODES:
 *   "r"  — read (file must exist)
 *   "w"  — write (creates or truncates)
 *   "a"  — append (creates or appends)
 *   "rb" — read binary
 *   "wb" — write binary
 *   Add "+" for read+write: "r+", "w+", "a+"
 *
 * BUFFERING MODES (setvbuf):
 *   _IOFBF — fully buffered (default for files)
 *   _IOLBF — line buffered (default for terminals)
 *   _IONBF — unbuffered
 */

#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <string.h>

/**
 * write_config() - Write key-value pairs to a configuration file
 * @path:   Filesystem path of the output file
 * @key:    Configuration key string
 * @value:  Configuration value string
 *
 * Return: 0 on success, -1 on error (errno is set by the failing call).
 *
 * The file is opened, written, and closed within this function.
 * Resources are always released even on error paths (RAII-style cleanup).
 */
int write_config(const char *path, const char *key, const char *value) {
    FILE *fp = fopen(path, "a");  /* Append mode — preserves existing data */
    if (fp == NULL) {
        fprintf(stderr, "fopen(%s): %s\\n", path, strerror(errno));
        return -1;
    }

    int ret = fprintf(fp, "%s = %s\\n", key, value);
    if (ret < 0) {
        fprintf(stderr, "fprintf failed\\n");
        fclose(fp);
        return -1;
    }

    /* fclose() flushes the buffer and releases the FILE handle */
    if (fclose(fp) != 0) {
        fprintf(stderr, "fclose: %s\\n", strerror(errno));
        return -1;
    }

    return 0;
}

/**
 * read_binary() - Read entire binary file into a heap-allocated buffer
 * @path:  Path to the file
 * @size:  Output parameter — set to the number of bytes read
 *
 * Return: Pointer to allocated buffer (caller must free()), or NULL on error.
 *
 * Uses fseek/ftell to determine file size, then fread to load contents.
 * Note: ftell returns long, which may overflow for files > 2 GB on 32-bit.
 */
unsigned char *read_binary(const char *path, size_t *size) {
    FILE *fp = fopen(path, "rb");
    if (!fp) return NULL;

    fseek(fp, 0, SEEK_END);
    long len = ftell(fp);
    rewind(fp);

    unsigned char *buf = (unsigned char *)malloc((size_t)len);
    if (!buf) { fclose(fp); return NULL; }

    *size = fread(buf, 1, (size_t)len, fp);
    fclose(fp);
    return buf;  /* Caller must free(buf) */
}`,

  stdlib: `/**
 * C STANDARD LIBRARY — KEY FUNCTIONS REFERENCE
 * ==============================================
 * The C standard library (libc) provides a set of header files and
 * routines for common operations. Below are the most important functions
 * grouped by header.
 *
 * <stdlib.h> — General utilities
 * ================================
 *   malloc(size)          Allocate size bytes (uninitialized)
 *   calloc(n, size)       Allocate n*size bytes (zero-initialized)
 *   realloc(ptr, size)    Resize allocation (may move the block)
 *   free(ptr)             Release allocated memory
 *   exit(status)          Terminate program with status code
 *   abort()               Abnormal termination (raises SIGABRT)
 *   atoi(str)             Convert string to int (no error detection)
 *   strtol(str,end,base)  Convert string to long (with error detection)
 *   qsort(base,n,sz,cmp)  Sort array using quicksort
 *   bsearch(key,base,...)  Binary search in sorted array
 *   rand()                Pseudo-random integer in [0, RAND_MAX]
 *   srand(seed)           Seed the PRNG
 *
 * <string.h> — String and memory operations
 * ===========================================
 *   strlen(s)             Length of string (excluding NUL terminator)
 *   strcpy(dst, src)      Copy string (UNSAFE — no bounds check)
 *   strncpy(dst,src,n)    Copy at most n bytes (may not NUL-terminate)
 *   strcat(dst, src)      Concatenate strings (UNSAFE)
 *   strcmp(s1, s2)        Lexicographic comparison (0 = equal)
 *   strstr(hay, needle)   Find first occurrence of substring
 *   memcpy(dst,src,n)     Copy n bytes (regions must not overlap)
 *   memmove(dst,src,n)    Copy n bytes (handles overlapping regions)
 *   memset(ptr,c,n)       Fill n bytes with value c
 *
 * <math.h> — Mathematical functions (link with -lm)
 * ===================================================
 *   sin/cos/tan(x)        Trigonometric functions (radians)
 *   sqrt(x)               Square root
 *   pow(x, y)             x raised to the power y
 *   fabs(x)               Absolute value of double
 *   ceil/floor(x)         Round toward +∞ / -∞
 *   log(x)                Natural logarithm
 *   log10(x)              Base-10 logarithm
 */

#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/**
 * safe_strdup() - Duplicate a string with error checking
 * @src: Source string to duplicate
 *
 * Return: Newly allocated copy of src, or NULL if allocation fails.
 *         Caller must free() the returned pointer.
 *
 * POSIX provides strdup(), but it is not in C17. This implementation
 * is portable to any conforming C17 compiler.
 */
char *safe_strdup(const char *src) {
    if (src == NULL) return NULL;
    size_t len = strlen(src) + 1;  /* +1 for NUL terminator */
    char *copy = (char *)malloc(len);
    if (copy == NULL) return NULL;
    memcpy(copy, src, len);
    return copy;
}

/**
 * int_compare() - Comparator for qsort() with integer arrays
 * @a: Pointer to first element
 * @b: Pointer to second element
 *
 * Return: negative if *a < *b, 0 if equal, positive if *a > *b.
 *
 * The cast through (const int *) is required because qsort passes
 * void pointers; dereferencing void* directly is undefined behavior.
 */
int int_compare(const void *a, const void *b) {
    int ia = *(const int *)a;
    int ib = *(const int *)b;
    return (ia > ib) - (ia < ib);  /* Branchless, avoids overflow */
}`,
}

export default function ComputerWorkspace({ onBack }: Props) {
  const [activeSection, setActiveSection] = useState('intro')

  return (
    <div className="flex w-full h-full bg-[#0d0e1a]">
      {/* 侧边栏 */}
      <motion.aside
        className="w-64 flex-shrink-0 flex flex-col border-r border-white/10 bg-[#0a0b14]"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* 侧边栏顶部 */}
        <div className="p-5 border-b border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-4"
          >
            ← 返回主页
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-lg">⌨</div>
            <div>
              <h2 className="text-white font-semibold text-sm">Computer Science</h2>
              <p className="text-gray-500 text-xs">C Language Docs</p>
            </div>
          </div>
        </div>

        {/* 文档章节列表 */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-gray-600 text-xs uppercase tracking-wider px-3 py-2">Documentation</p>
          {DOC_SECTIONS.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                activeSection === section.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
              {activeSection === section.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* 侧边栏底部状态 */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>ISO/IEC 9899:2018 · C17</span>
          </div>
        </div>
      </motion.aside>

      {/* 主体区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部标题栏 */}
        <motion.div
          className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0c0d18]"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <span className="text-gray-400 text-sm font-mono">
              {DOC_SECTIONS.find(s => s.id === activeSection)?.label ?? ''}.c
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Read Only</span>
            <span>C · UTF-8</span>
            <span className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
              Dark Mode
            </span>
          </div>
        </motion.div>

        {/* Monaco Editor */}
        <motion.div
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          key={activeSection}
        >
          <Editor
            height="100%"
            language="c"
            value={DOC_CONTENT[activeSection]}
            theme="vs-dark"
            options={{
              readOnly: true,
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              renderLineHighlight: 'all',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              padding: { top: 16, bottom: 16 },
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}
