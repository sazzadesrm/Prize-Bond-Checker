<?php
/**
 * Bangladesh Prize Bond Checker - Standalone PHP Web Application
 * Developer: Sazzad Kabir (sazzadmbstu@gmail.com / +88-01810-076761)
 */

require_once __DIR__ . '/config.php';

$user = getAuthUser();
$lang = isset($_GET['lang']) ? $_GET['lang'] : (isset($_COOKIE['pb_lang']) ? $_COOKIE['pb_lang'] : 'bn');
$tab = isset($_GET['tab']) ? $_GET['tab'] : 'single';

?>
<!DOCTYPE html>
<html lang="<?php echo htmlspecialchars($lang); ?>" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prize Bond Checker - বাংলাদেশ প্রাইজবন্ড ড্র ফলাফল</title>
    <meta name="description" content="Official 100 Tk. Bangladesh Prize Bond result checker, portfolio tracker, and draw schedule.">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            green: '#006A4E',
                            red: '#F42A41',
                            darkGreen: '#00543D'
                        }
                    }
                }
            }
        }
    </script>
    <style>
        .seal-glow { filter: drop-shadow(0 4px 6px rgba(0, 106, 78, 0.2)); }
    </style>
</head>
<body class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans">

<?php if (!$user): ?>
    <!-- ======================================================== -->
    <!-- AUTHENTICATION GATEWAY (DEFAULT OPEN PAGE)               -->
    <!-- ======================================================== -->
    <div class="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6">
        
        <!-- Header -->
        <div class="max-w-7xl w-full mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-1 overflow-hidden">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/512px-Government_Seal_of_Bangladesh.svg.png" alt="Seal" class="w-full h-full object-contain" />
                </div>
                <div>
                    <h1 class="text-lg font-black tracking-tight text-slate-900 dark:text-white">Prize Bond Checker</h1>
                    <p class="text-[11px] text-slate-500 font-medium">Government of Bangladesh Verified</p>
                </div>
            </div>
            <button onclick="toggleLang()" class="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold shadow-xs">
                🇧🇩 <?php echo $lang === 'bn' ? 'English' : 'বাংলা'; ?>
            </button>
        </div>

        <!-- Center Login Card -->
        <div class="max-w-md w-full mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-8">
            <div class="text-center space-y-2">
                <div class="w-16 h-16 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center mx-auto p-1.5">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/512px-Government_Seal_of_Bangladesh.svg.png" alt="Seal" class="w-full h-full object-contain" />
                </div>
                <h2 class="text-2xl font-black text-slate-900 dark:text-white">
                    <?php echo $lang === 'bn' ? 'অ্যাকাউন্টে প্রবেশ করুন' : 'Sign in to Your Account'; ?>
                </h2>
                <p class="text-xs text-slate-500">
                    <?php echo $lang === 'bn' ? '১০০ টাকা মূল্যমানের প্রাইজবন্ড ড্র ফলাফল ও পোর্টফোলিও ট্র্যাকার' : '100 Tk. Bangladesh Prize Bond Verification Engine'; ?>
                </p>
            </div>

            <div id="authAlert" class="hidden p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold"></div>

            <!-- Login Form -->
            <form id="phpLoginForm" onsubmit="handlePhpLogin(event)" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        <?php echo $lang === 'bn' ? 'ইমেইল' : 'Email Address'; ?>
                    </label>
                    <input type="email" id="email" required placeholder="investor@prizebond.gov.bd" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden" />
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        <?php echo $lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'; ?>
                    </label>
                    <input type="password" id="password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-hidden" />
                </div>

                <button type="submit" id="loginBtn" class="w-full py-3 rounded-xl font-extrabold text-sm text-white bg-[#006A4E] hover:bg-[#00543D] transition shadow-md">
                    <?php echo $lang === 'bn' ? 'লগইন করুন ও প্রবেশ করুন' : 'Sign In & Enter'; ?>
                </button>
            </form>

            <!-- Quick 1-Click Fast Login -->
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p class="text-center text-[11px] font-bold text-slate-400 uppercase">
                    <?php echo $lang === 'bn' ? 'অথবা ১-ক্লিক ডেমো লগইন' : 'Or 1-Click Fast Demo'; ?>
                </p>
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="fillDemo('investor@prizebond.gov.bd', 'password123')" class="py-2 px-3 rounded-xl border border-emerald-300 bg-emerald-50 text-[#006A4E] font-bold text-xs hover:bg-emerald-100 transition">
                        Investor Demo
                    </button>
                    <button onclick="fillDemo('sazzadmbstu@gmail.com', 'password123')" class="py-2 px-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 transition">
                        Admin Demo
                    </button>
                </div>
            </div>
        </div>

        <!-- Footer Info -->
        <footer class="max-w-7xl w-full mx-auto text-center text-xs text-slate-500 py-4">
            <p><strong>Prize Bond Checker</strong> • Developer: <strong>Sazzad Kabir</strong> (sazzadmbstu@gmail.com | +88-01810-076761)</p>
        </footer>
    </div>

<?php else: ?>
    <!-- ======================================================== -->
    <!-- AUTHENTICATED APP DASHBOARD                              -->
    <!-- ======================================================== -->
    <header class="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-1 overflow-hidden">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_Seal_of_Bangladesh.svg/512px-Government_Seal_of_Bangladesh.svg.png" alt="Seal" class="w-full h-full object-contain" />
                </div>
                <div>
                    <span class="font-black text-lg tracking-tight text-slate-900 dark:text-white">Prize Bond Checker</span>
                    <span class="ml-2 text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">100 ৳</span>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden sm:inline">
                    <?php echo htmlspecialchars($user['name']); ?>
                </span>
                <button onclick="handlePhpLogout()" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition">
                    <?php echo $lang === 'bn' ? 'লগআউট' : 'Logout'; ?>
                </button>
            </div>
        </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <!-- Interactive Single Checker Card -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
            <div class="max-w-xl">
                <h2 class="text-2xl font-black text-slate-900 dark:text-white">
                    <?php echo $lang === 'bn' ? 'একক প্রাইজবন্ড যাচাই করুন' : 'Single Prize Bond Search'; ?>
                </h2>
                <p class="text-xs text-slate-500 mt-1">
                    Enter any 7-digit bond serial number to check against the last 2 years of official draws.
                </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 max-w-xl">
                <input type="text" id="checkBondNumber" maxlength="7" placeholder="0528419" class="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-lg font-mono font-bold tracking-wider" />
                <button onclick="runSingleCheck()" class="px-6 py-3 rounded-2xl font-extrabold text-sm text-white bg-[#006A4E] hover:bg-[#00543D] transition shadow-md">
                    <?php echo $lang === 'bn' ? 'ফলাফল দেখুন' : 'Search Result'; ?>
                </button>
            </div>

            <div id="singleCheckResult" class="hidden"></div>
        </div>

        <!-- Developer Contact Card -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Developer Information</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <span class="text-slate-400 font-bold block">Developer</span>
                    <strong class="text-sm">Sazzad Kabir</strong> (MBSTU Alumnus)
                </div>
                <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <span class="text-slate-400 font-bold block">Email</span>
                    <a href="mailto:sazzadmbstu@gmail.com" class="text-emerald-600 font-bold">sazzadmbstu@gmail.com</a>
                </div>
                <div class="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <span class="text-slate-400 font-bold block">Phone</span>
                    <a href="tel:+8801810076761" class="text-emerald-600 font-bold">+88-01810-076761</a>
                </div>
            </div>
        </div>
    </main>

    <!-- Clean Footer -->
    <footer class="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-6 px-4">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
            <p>Prize Bond Checker • © <?php echo date('Y'); ?> All rights reserved.</p>
            <p>Developer: Sazzad Kabir (+88-01810-076761)</p>
        </div>
    </footer>
<?php endif; ?>

<script>
async function handlePhpLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const alertBox = document.getElementById('authAlert');

    try {
        const res = await fetch('auth.php?action=login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
        const data = await res.json();
        if (data.success) {
            window.location.reload();
        } else {
            alertBox.textContent = data.error || 'Login failed';
            alertBox.classList.remove('hidden');
        }
    } catch (err) {
        alertBox.textContent = 'Server connection error';
        alertBox.classList.remove('hidden');
    }
}

function fillDemo(email, pass) {
    document.getElementById('email').value = email;
    document.getElementById('password').value = pass;
    document.getElementById('phpLoginForm').dispatchEvent(new Event('submit'));
}

async function handlePhpLogout() {
    await fetch('auth.php?action=logout');
    window.location.reload();
}

async function runSingleCheck() {
    const num = document.getElementById('checkBondNumber').value;
    const resBox = document.getElementById('singleCheckResult');
    if (!num) return;

    resBox.innerHTML = '<p class="text-xs text-slate-400">Searching official draws...</p>';
    resBox.classList.remove('hidden');

    const res = await fetch(`api.php?action=check_single&number=${num}`);
    const data = await res.json();

    if (data.is_winner) {
        resBox.innerHTML = `
            <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900">
                <h4 class="font-extrabold text-base">🎉 Congratulations! Winning Bond Found!</h4>
                <p class="text-xs mt-1">Bond #${data.bond_number} won in ${data.total_wins} draw(s)!</p>
            </div>
        `;
    } else {
        resBox.innerHTML = `
            <div class="p-4 rounded-2xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                <h4 class="font-bold text-sm">No Prize in Current Active Draws</h4>
                <p class="text-xs text-slate-500 mt-1">Bond #${data.bond_number} was not drawn in the active 2-year cycle.</p>
            </div>
        `;
    }
}
</script>
</body>
</html>
