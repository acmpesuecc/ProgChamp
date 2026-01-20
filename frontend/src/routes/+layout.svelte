<script>
    import '../app.css'
    import { goto } from '$app/navigation'
    import { page } from '$app/stores'
    import { signIn, signOut} from '@auth/sveltekit/client'

    let isProfileOpen = false

    function showProfile() {
        isProfileOpen = !isProfileOpen
    }

    $: session = $page.data.session;
    $: user = session?.user;
    $: role = user?.email?.endsWith('@pes.edu') ? 'admin' : 'dev';

</script>

<header>
    <div class="topbar">
        <button class="profile-btn" on:click={showProfile}>
            {user ? user.name : 'Guest'}
        </button>

        {#if user && isProfileOpen}
            <div class="profile-dropdown">
                <p>{user.name}</p>

                {#if role === "dev"}
                    <button on:click={() => goto('/my-games')}>My Games</button>
                    <button on:click={() => goto('/upload')}>Publish Game</button>
                {/if}

                {#if role === "admin"}
                    <button on:click={() => goto('/admin')}>Dashboard</button>
                {/if}

                <button class="sign-out" on:click={() => signOut()}>
                    Sign Out
                </button>
            </div>
        {/if}

        {#if !user}
            <button class="login-btn" on:click={() => signIn('google')}>
                Sign in with Google
            </button>
        {/if}
    </div>

    <a href="/">
        <h1>Progchamp!</h1>
    </a>

</header>

<main>
    <slot />
</main>

<footer>
    <small>© ACM PESUECC</small>
</footer>

<style>
    header {
        position: relative;
        margin: 0;
    }

    .topbar {
        position: absolute;
        top: 10px;
        right: 10px;
    }

    header h1 {
        margin: 0;
        color: #ff006f;
        text-align: center;
        text-transform: uppercase;
        font-size: 3em;
        font-weight: 100;
    }

    nav {
        margin: 0;
        color: #ff006f;
        text-align: center;
        text-transform: uppercase;
        font-size: 2em;
        font-weight: 100;
    }

    main {
        text-align: center;
        padding-top: 0.5rem;
    }

    .login-btn, .profile-btn {
        width: 150px;
        height: 32px;
        border: 1px solid #8c5cd9;
        border-radius: 8px;
        background-color: #0a0a0f;
        color: lavender;
        cursor: pointer;
        transition: transform 150ms ease, border-color 150ms ease;
        display: inline-block;
        will-change: transform, border-color;
    }

    /* .login-btn:hover, .profile-btn:hover {
        border-color: #ca1261;
        transform: translateY(-2px);
    } */

    .profile-dropdown {
        margin-top: 8px;
        padding: 0.7rem;
        border: 1px solid #ca1261;
        border-radius: 10px;
        width: 170px;
        background-color: #0a0a0f;
        color: lavender;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 10;
    }

    .profile-dropdown p {
        margin: 0;
        font-size: 0.95rem;
        opacity: 0.8;
    }

    .profile-dropdown button {
        width: 100%;
        padding: 0.4rem;
        color: lavender;
        background-color: #0a0a0f;
        border: 1px solid aqua;
        border-radius: 6px;
        cursor: pointer;
    }

    .profile-dropdown button:hover {
        border-color: #ca1261;
        transform: scale(1.03);
        transition: all 150ms ease;
    }

    a {
        text-decoration: none;
        transition: transform 0.15s ease;
    }

    a:link, a:visited {
        color: #ff006f;
    }

    a:hover {
        color: #ca1261;
        transform: translateY(-2px);
    }

    footer {
        font-size: large;
        width: 100%;
        text-align: center;
        position: relative;
        color: rgb(67, 108, 255);
    }
</style>
