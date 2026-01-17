<script>
    import '../app.css'
    import { user } from '$lib/stores/user.js';
    import Button from '$lib/components/layout/ui/Button.svelte';

    let isProfileOpen = false;

    function showProfile(){
        isProfileOpen = !isProfileOpen;
    }


</script>

<header>
    
    <button class = "profile-btn" on:click = {showProfile}>
        {$user.isSignedIn? $user.name : 'Guest'}
    </button>

    {#if $user.isSignedIn && isProfileOpen}
        <div class="profile-dropdown">
            <p> Guest <!-- {$user.name} --> </p>
            <hr width="130px">
            
            {#if $user?.role === "dev"}
                <button class = "my-games">
                    My Games
                </button>
                <button class = "pub-games">
                    Publish Games
                </button>
            {/if}

            {#if $user?.role === "admin"}
                <button class = "dashbd">
                    Dashboard
                </button>
            {/if}

            <button class = "sign-out">
                Sign Out
            </button>
        </div>
    {/if}

    {#if !$user.isSignedIn}
        <button class = "login-btn">
            Sign in with Google
        </button>
    {/if}
    
    <a href = "/">
        <h1> Progchamp! </h1>
    </a>

     <nav>
        <a href="/">Home</a>

        {#if $user?.role === "dev"}
            | <a href="/upload">Upload</a>
        {/if}

        {#if $user?.role === "admin"}
            | <a href="/admin">Admin</a>
        {/if}
    </nav>
</header>

<main>
    <slot />
</main>

<footer>
    <small>© ACM PESUECC ?</small>
</footer>

<style>

	main {
        justify-content: center;
    	text-align: center;
        padding-top: 0.5rem;
	}

    header {
        margin: 0%
    }

    header h1{
        margin: 0.2rem 0;  /*there was too much space above and below the header*/
        padding: 0;
        margin:0%;
        color: #ff006f;
        text-align: center;
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
    }

    nav {
        padding: 0;
        margin:0%;
        color: #ff006f;
        text-align: center;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 100
    }

    .login-btn, .profile-btn {
        position: absolute;
        right: 10px;
        width: 120px;
        height: 30px;
        border: 1px solid;
        border-color: #8c5cd9;
        border-radius: 8px;
        background-color: #0a0a0f;
        color: lavender;
    }

    .profile-btn{
        top: 10px;
    }

    .login-btn{
        top: 50px;
        width: 150px;
    }

    .login-btn:hover, .profile-btn:hover{
        border-color: #ca1261;
        transform: scale(1.05);
        transition: all 150ms ease;
    }

    .profile-dropdown {
        text-align: center;
        position: absolute;
        right: 10px;
        top: 50px;
        padding-bottom: 1em;
        border: 1px solid;
        border-radius: 8px;
        border-color: #ca1261;
        width: 150px;
        color: lavender;
        font-size: large;
    }

    .profile-dropdown button {
        width: 130px;
        color: lavender;
        background-color: #0a0a0f;
        border: 1px solid;
        border-radius: 6px;
        border-color: aqua;
    }

    .profile-dropdown button:hover{
        border-color: #ca1261;
        transform: scale(1.05);
        transition: all 150ms ease;
    }

    a{
        text-decoration: none;
        transition: transform 0.15s ease;

    }
    a:link{
		color: #ff006f;
    }
    
    a:visited{
		color: #ff006f;
    }

    a:hover{
		color: #ca1261;
        text-shadow: #2e4186;
        transform: translateY(-4px);
    }

    footer {
        font-size: large;
        bottom: 0;
        left: 0;
        width: 100%;
        text-align: center;
        position: relative;
        color: rgb(67, 108, 255);
    }
</style>