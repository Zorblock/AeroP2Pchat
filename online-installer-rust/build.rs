fn main() {
    println!("cargo:rerun-if-changed=../assets/app.ico");
    println!("cargo:rerun-if-changed=../assets/app-150.png");
    slint_build::compile("ui/main.slint").expect("Unable to compile the installer UI");

    if cfg!(target_os = "windows") {
        let mut resources = winres::WindowsResource::new();
        resources.set_icon("../assets/app.ico");
        resources.set("CompanyName", "Zorblock");
        resources.set("FileDescription", "Aero P2P Chat Online Installer");
        resources.set("ProductName", "Aero P2P Chat Online Installer");
        resources.set("OriginalFilename", "Aero-P2P-Chat-Online-Installer.exe");
        resources.set("LegalCopyright", "Copyright (c) 2026 Zorblock");
        resources
            .compile()
            .expect("Unable to embed Windows installer resources");
    }
}
